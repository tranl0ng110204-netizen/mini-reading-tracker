<template>
  <a-modal
    :open="open"
    title="Thêm vào tủ sách"
    :ok-text="'Thêm sách'"
    :cancel-text="'Hủy'"
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="close"
  >
    <div style="padding: 12px 0;">
      <a-typography-paragraph :ellipsis="{ rows: 2 }" :content="bookTitle" style="font-weight: 600; font-size: 16px;" />

      <a-typography-text type="secondary" style="display: block; margin-bottom: 12px;">
        Chọn trạng thái ban đầu cho cuốn sách này:
      </a-typography-text>

      <a-radio-group v-model:value="status" button-style="solid" style="width: 100%;">
        <a-radio-button
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          :value="option.value"
          style="width: 33.33%; text-align: center;"
        >
          {{ option.label }}
        </a-radio-button>
      </a-radio-group>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { addBookToLibrary } from '../api/libraryApi'
import { STATUS_OPTIONS } from '../utils/book'

const props = defineProps({
  open: { type: Boolean, default: false },
  workId: { type: String, default: '' },
  bookTitle: { type: String, default: '' },
})
const emit = defineEmits(['update:open', 'added'])

const status = ref('WANT_TO_READ')
const submitting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      status.value = 'WANT_TO_READ'
      submitting.value = false
    }
  }
)

const close = () => emit('update:open', false)

const handleOk = async () => {
  submitting.value = true
  try {
    await addBookToLibrary(props.workId, status.value)
    message.success(`Đã thêm "${props.bookTitle}" vào tủ sách`)
    emit('added', props.workId)
    close()
  } catch (err) {
    message.error(err.message)
  } finally {
    submitting.value = false
  }
}
</script>
