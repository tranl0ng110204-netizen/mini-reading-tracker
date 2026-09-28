<template>
  <div class="cover-wrapper" :class="{ 'cover-auto': isAuto }" :style="isAuto ? {} : { height }">
    <img
      v-if="coverId && !failed"
      :src="coverUrl(coverId, size)"
      :alt="title"
      class="cover-img"
      loading="lazy"
      @error="failed = true"
    />
    <div v-else class="cover-fallback">
      <PictureOutlined />
      <span>Không có ảnh bìa</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { PictureOutlined } from '@ant-design/icons-vue'
import { coverUrl } from '../utils/book'

const props = defineProps({
  coverId: { type: [String, Number], default: null },
  title: { type: String, default: '' },
  size: { type: String, default: 'M' },
  height: { type: String, default: '240px' },
})

const failed = ref(false)
const isAuto = computed(() => props.height === 'auto')

watch(() => props.coverId, () => { failed.value = false })
</script>

<style scoped>
.cover-wrapper {
  width: 100%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover-img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.cover-auto {
  aspect-ratio: 2 / 3;
}
.cover-auto .cover-img {
  object-fit: contain;
}
.cover-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #bfbfbf;
  font-size: 13px;
  padding: 12px;
  text-align: center;
}
</style>
