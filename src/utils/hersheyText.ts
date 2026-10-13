// Single-stroke text for pen plotters: renders text as polylines with a Hershey font
// (each letter is drawn once by the pen, unlike outline fonts which are traced twice).
// The font file keeps the Hershey acknowledgements in its <metadata>, as its licence requires.
import fontSource from '@/assets/fonts/HersheySans1.svg?raw'
import type { Point } from './geometry'

interface Glyph {
    advance: number
    // Font units, y pointing up from the baseline
    strokes: Point[][]
    minX: number
    maxX: number
}

interface HersheyFont {
    glyphs: Map<string, Glyph>
    unitsPerEm: number
    capHeight: number
    xHeight: number
}

export interface TextOptions {
    // Pixel position of the baseline start (or middle with anchor 'middle')
    x: number
    y: number
    size: number
    anchor?: 'start' | 'middle'
}

const CURVE_STEPS = 8

// Characters missing from the font, replaced before rendering
const SUBSTITUTES: Record<string, string> = {
    '’': "'",
    '‘': "'",
    '«': '"',
    '»': '"',
    œ: 'oe',
    Œ: 'OE',
    æ: 'ae',
    Æ: 'AE',
    '–': '-',
    '—': '-',
}

let font: HersheyFont | undefined

// Parses an SVG font path made of M, L and C commands into polylines
const parseStrokes = (d: string): Point[][] => {
    const tokens = d.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []
    const strokes: Point[][] = []
    let current: Point[] = []
    let command = ''
    let i = 0
    const next = () => Number(tokens[i++])
    while (i < tokens.length) {
        if (/[MLC]/i.test(tokens[i]!)) command = tokens[i++]!.toUpperCase()
        if (command === 'M') {
            if (current.length > 1) strokes.push(current)
            current = [{ x: next(), y: next() }]
            command = 'L'
        } else if (command === 'L') {
            current.push({ x: next(), y: next() })
        } else if (command === 'C') {
            const p0 = current[current.length - 1]!
            const [c1, c2, p3] = [0, 1, 2].map(() => ({ x: next(), y: next() })) as [
                Point,
                Point,
                Point,
            ]
            for (let s = 1; s <= CURVE_STEPS; s++) {
                const t = s / CURVE_STEPS
                const u = 1 - t
                current.push({
                    x: u ** 3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * p3.x,
                    y: u ** 3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * p3.y,
                })
            }
        } else {
            i++
        }
    }
    if (current.length > 1) strokes.push(current)
    return strokes
}

const loadFont = (): HersheyFont => {
    if (font) return font
    const doc = new DOMParser().parseFromString(fontSource, 'image/svg+xml')
    const fontElement = doc.querySelector('font')
    const defaultAdvance = Number(fontElement?.getAttribute('horiz-adv-x') ?? 500)
    const glyphs = new Map<string, Glyph>()
    doc.querySelectorAll('glyph').forEach((el) => {
        const unicode = el.getAttribute('unicode')
        if (!unicode) return
        const strokes = parseStrokes(el.getAttribute('d') ?? '')
        const xs = strokes.flat().map((p) => p.x)
        glyphs.set(unicode, {
            advance: Number(el.getAttribute('horiz-adv-x') ?? defaultAdvance),
            strokes,
            minX: xs.length ? Math.min(...xs) : 0,
            maxX: xs.length ? Math.max(...xs) : 0,
        })
    })
    const top = (char: string, fallback: number) => {
        const ys =
            glyphs
                .get(char)
                ?.strokes.flat()
                .map((p) => p.y) ?? []
        return ys.length ? Math.max(...ys) : fallback
    }
    const unitsPerEm = Number(doc.querySelector('font-face')?.getAttribute('units-per-em') ?? 1000)
    font = { glyphs, unitsPerEm, capHeight: top('H', 700), xHeight: top('x', 450) }
    return font
}

// Accents drawn over (or under) a base letter, in font units relative to its centre and top
const accentStrokes = (mark: string, cx: number, top: number, em: number): Point[][] => {
    const w = em * 0.07
    const y = top + em * 0.1
    const h = em * 0.1
    switch (mark) {
        case '́': // acute
            return [
                [
                    { x: cx - w * 0.6, y },
                    { x: cx + w * 0.8, y: y + h },
                ],
            ]
        case '̀': // grave
            return [
                [
                    { x: cx + w * 0.6, y },
                    { x: cx - w * 0.8, y: y + h },
                ],
            ]
        case '̂': // circumflex
            return [
                [
                    { x: cx - w, y },
                    { x: cx, y: y + h },
                    { x: cx + w, y },
                ],
            ]
        case '̌': // caron
            return [
                [
                    { x: cx - w, y: y + h },
                    { x: cx, y },
                    { x: cx + w, y: y + h },
                ],
            ]
        case '̈': // diaeresis: two short strokes, a dot is invisible on a plotter
            return [
                [
                    { x: cx - w, y: y + h * 0.3 },
                    { x: cx - w, y: y + h * 0.7 },
                ],
                [
                    { x: cx + w, y: y + h * 0.3 },
                    { x: cx + w, y: y + h * 0.7 },
                ],
            ]
        case '̃': // tilde
            return [
                [
                    { x: cx - w * 1.2, y: y + h * 0.3 },
                    { x: cx - w * 0.5, y: y + h * 0.8 },
                    { x: cx + w * 0.5, y: y + h * 0.2 },
                    { x: cx + w * 1.2, y: y + h * 0.7 },
                ],
            ]
        case '̧': // cedilla, under the baseline
            return [
                [
                    { x: cx, y: 0 },
                    { x: cx, y: -em * 0.06 },
                    { x: cx + w, y: -em * 0.1 },
                    { x: cx - w * 0.6, y: -em * 0.16 },
                ],
            ]
        default:
            return []
    }
}

// Text as pixel polylines, ready to be drawn as SVG paths
export const textToPolylines = (
    text: string,
    { x, y, size, anchor = 'start' }: TextOptions,
): Point[][] => {
    const { glyphs, unitsPerEm, capHeight, xHeight } = loadFont()
    const scale = size / unitsPerEm
    const clean = [...text].map((char) => SUBSTITUTES[char] ?? char).join('')

    // Base letter followed by its combining accents (é -> e + ́)
    const clusters = clean.normalize('NFD').match(/\P{M}\p{M}*/gu) ?? []
    const strokes: Point[][] = []
    let cursor = 0
    clusters.forEach((cluster) => {
        const [base = '', ...marks] = [...cluster]
        const glyph = glyphs.get(base) ?? glyphs.get('?')
        if (!glyph) return
        const isLower = base !== base.toUpperCase()
        const top = isLower ? xHeight : capHeight
        const cx = (glyph.minX + glyph.maxX) / 2
        const glyphStrokes = [
            ...glyph.strokes,
            ...marks.flatMap((mark) => accentStrokes(mark, cx, top, unitsPerEm)),
        ]
        glyphStrokes.forEach((stroke) =>
            strokes.push(stroke.map((p) => ({ x: cursor + p.x, y: p.y }))),
        )
        cursor += glyph.advance
    })

    const offset = anchor === 'middle' ? (cursor * scale) / 2 : 0
    return strokes.map((stroke) =>
        stroke.map((p) => ({ x: x - offset + p.x * scale, y: y - p.y * scale })),
    )
}

export const textCapHeight = (size: number): number => {
    const { unitsPerEm, capHeight } = loadFont()
    return (capHeight * size) / unitsPerEm
}
