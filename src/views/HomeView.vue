<template>
    <main class="home-cover w-full h-full flex justify-center items-center home-view">
        <div
            class="flex justify-between items-center max-w-6xl w-4/5 h-4/5 max-width flex-col md:flex-col lg:flex-row"
        >
            <div class="py-4 px-4 bg-white rounded-lg w-full lg:w-1/2">
                <h1 class="title-main font-bold">Dessiner des cartes, à votre image</h1>
                <p class="mt-2 text-base pb-12">
                    Un outil simple pour créer et imprimer vos propres cartes topographiques.
                </p>
                <p class="mt-2 text-base">
                    🧭 Tenez le cap : inscrivez-vous à la newsletter pour suivre l'évolution de
                    l’application et les ajouts à venir.
                </p>
                <baseForm
                    ref="newsletterForm"
                    class="flex items-start justify-start gap-4 my-8"
                    v-if="!isUserSubscribed"
                >
                    <baseTextInput
                        class=""
                        v-model="email"
                        label="Email"
                        placeholder="Email"
                        :rules="[emailValidatorRule]"
                        required
                    />
                    <baseButton
                        :loading="isFormLoading"
                        appendIcon="send"
                        @click="handleSubscription"
                    >
                        S'inscrire
                    </baseButton>
                </baseForm>
                <p class="mt-4 text-title" v-else>
                    Merci, vous êtes désormais abonné à la newsletter Atlasio !
                </p>
            </div>
            <div class="w-full lg:w-1/2">
                <img
                    src="/img/index/cover_bg.png"
                    class="w-full"
                    alt="fond de carte topographique qvec trave de randonée"
                />
            </div>
        </div>
    </main>
</template>
<script setup lang="ts">
import BaseForm from '@/components/Ui/BaseForm.vue'
import BaseButton from '@/components/Ui/BaseButton.vue'
import BaseTextInput from '@/components/Ui/BaseTextInput.vue'
import axios from 'axios'
import { emailValidatorRule } from '@/utils/validators'
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/Notifications'

const newsletterForm = ref<InstanceType<typeof BaseForm> | null>(null)
const email = ref('')
const isFormLoading = ref(false)
const notificationStore = useNotificationStore()
const isUserSubscribed = ref<boolean>(false)
const handleSubscription = async () => {
    const isFormValid = await newsletterForm.value?.validate()
    if (isFormValid != true) return
    isFormLoading.value = true
    try {
        await axios.post('https://atlasio-server-production.up.railway.app/newsletter/subscribe/', {
            email: email.value,
        })
        isUserSubscribed.value = true
        notificationStore.add({
            type: 'success',
            message: 'Vous êtes maintenant abonné à la newsletter !',
        })
    } catch (error) {
        notificationStore.add({
            type: 'error',
            message: "Une erreur est survenue lors de l'abonnement à la newsletter.",
        })
        console.error('Error subscribing to newsletter:', error)
    } finally {
        isFormLoading.value = false
    }
}
</script>
<style scoped lang="scss">
.home-cover {
    height: 100vh;
}
</style>
