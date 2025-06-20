<template>
    <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
        <BaseCard class="p-10 shadow-lg">
            <h3 class="text-3xl font-bold mb-6 ta-center">Login</h3>
            <BaseForm ref="loginFormRef" class="w-96 space-y-4">
                <BaseTextInput
                    v-model="loginForm.email"
                    placeholder="Email"
                    :rules="[emailValidatorRule]"
                />
                <BaseTextInput
                    v-model="loginForm.password"
                    type="password"
                    placeholder="Password"
                    :rules="[
                        (value) =>
                            value.length >= 6 || 'Password must be at least 6 characters long',
                    ]"
                />
                <BaseButton
                    @click="handleLogin"
                    class="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Login
                </BaseButton>
            </BaseForm>
        </BaseCard>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseForm from '@/components/Ui/BaseForm.vue'
import BaseTextInput from '@/components/Ui/BaseTextInput.vue'
import BaseButton from '@/components/Ui/BaseButton.vue'
import BaseCard from '@/components/Ui/BaseCard.vue'
import { useNotificationStore } from '@/store/Notifications'
import { emailValidatorRule } from '@/utils/validators'
const loginFormRef = ref<InstanceType<typeof BaseForm>>(null)
const loginForm = ref({
    email: '',
    password: '',
})
const notificationStore = useNotificationStore()

const handleLogin = async () => {
    if (!loginFormRef.value?.validate()) return
    try {
        // Simulate login API call
        await new Promise((resolve) => setTimeout(resolve, 100))
        notificationStore.add({
            type: 'success',
            message: 'Login successful!',
        })
    } catch (error) {
        notificationStore.add({
            type: 'error',
            message: 'Login failed. Please try again.',
        })
    }
}
</script>

<style scoped lang="scss"></style>
