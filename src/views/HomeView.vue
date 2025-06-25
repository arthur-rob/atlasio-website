<template>
    <main class="">
        <div class="home-cover w-full h-full flex justify-center items-center home-view">
            <div class="flex justify-between items-center max-w-6xl w-4/5 h-4/5">
                <div class="py-4 px-4 bg-white rounded-lg shadow-lg max-w-1/2 h-full">
                    <h1 class="text-4xl font-bold">
                        Créer vos cartes personnalisées<br />
                        comme un dessin
                    </h1>
                    <p class="mt-2 text-2xl">Select layers and generate SVG maps.</p>
                    <p class="mt-2 text-2xl">Use the options on the right to customize your map.</p>
                    <baseForm ref="newsletterForm">
                        <baseTextInput
                            v-model="email"
                            label="Email"
                            placeholder="Enter your email"
                            :rules="[emailValidatorRule]"
                            required
                        />
                        <baseButton
                            class="mt-4 w-full"
                            :loading="isFormLoading"
                            appendIcon="send"
                            @click="handleSubscription"
                        >
                            Subscribe to Newsletter
                        </baseButton>
                    </baseForm>
                </div>
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
import { useNotificationStore } from '@/store/Notifications'

const newsletterForm = ref<InstanceType<typeof BaseForm> | null>(null)
const email = ref('')
const isFormLoading = ref(false)
const notificationStore = useNotificationStore()
const handleSubscription = async () => {
    const isFormValid = await newsletterForm.value?.validate()
    if (isFormValid != true) return
    isFormLoading.value = true
    try {
        await axios.post('https://atlasio-server-production.up.railway.app/newsletter/subscribe', {
            email: email.value,
        })

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
    background-image: url('/src/assets/home/contour.svg');
    background-size: cover;
    background-position: center;
    height: 100vh;
}
</style>
