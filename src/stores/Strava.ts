import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useStravaStore = defineStore('strava', () => {
    const activities = ref<StravaActivity[]>([])
    const token = ref<string | null>(localStorage.getItem('strava_token'))
    const isLogin = ref<boolean>(!!token.value)

    const listener = async (event: MessageEvent) => {
        if (event.origin !== import.meta.env.VITE_API_BASE_URL) return // Adjust origin

        const res_token = event.data?.token
        if (!res_token) return

        localStorage.setItem('strava_token', res_token)
        token.value = res_token
        isLogin.value = true
        fetchActivities()

        window.removeEventListener('message', listener)
    }

    const connect = async () => {
        window.open(
            `${import.meta.env.VITE_API_BASE_URL}/strava/auth`,
            'stravaAuth',
            'width=500,height=600',
        )
        window.addEventListener('message', listener)
    }

    const fetchActivities = async () => {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/strava/activities`, {
            params: {
                token: token.value,
            },
        })
        activities.value = data
    }

    return {
        isLogin,
        activities,

        connect,
        fetchActivities,
    }
})
