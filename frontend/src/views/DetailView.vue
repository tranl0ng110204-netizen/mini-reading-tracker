<template>
  <div style="max-width: 1000px; margin: 0 auto;">
    <a-button type="link" @click="$router.back()" style="margin-bottom: 24px; padding-left: 0; font-size: 16px;">
      <ArrowLeftOutlined /> Quay lại
    </a-button>

    <!-- Loading -->
    <div v-if="isLoading" style="text-align: center; padding: 100px 0;">
      <a-spin size="large" tip="Đang lấy thông tin sách..." />
    </div>

    <!-- Error -->
    <a-result
      v-else-if="error"
      status="warning"
      title="Không tải được thông tin sách"
      :sub-title="error"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="fetchData">Thử lại</a-button>
          <a-button @click="$router.push('/')">Về trang tìm kiếm</a-button>
        </a-space>
      </template>
    </a-result>

    <a-card v-else-if="book" :bordered="false" class="custom-detail-card" :bodyStyle="{ padding: 0 }">
      <a-row>
        <!-- Cột trái: ảnh bìa + hành động -->
        <a-col :xs="24" :md="8" class="left-col">
          <div class="cover-container">
            <BookCover :cover-id="book.cover_id" :title="book.title" size="L" height="auto" />
          </div>

          <a-button
            v-if="!libraryBook"
            type="primary"
            size="large"
            block
            class="add-btn"
            @click="addModalOpen = true"
          >
            <PlusOutlined /> Thêm vào tủ sách
          </a-button>

          <template v-else>
            <a-tag :color="statusColor(libraryBook.status)" class="in-library-tag">
              <CheckCircleOutlined /> {{ statusLabel(libraryBook.status) }}
            </a-tag>

            <div v-if="hasProgress(libraryBook)" class="progress-box">
              <div class="progress-label">
                <span>Trang {{ libraryBook.current_page }} / {{ libraryBook.total_pages }}</span>
                <span>{{ progressPercent(libraryBook) }}%</span>
              </div>
              <a-progress
                :percent="progressPercent(libraryBook)"
                :status="libraryBook.status === 'READ' ? 'success' : 'active'"
                :show-info="false"
              />
            </div>

            <div v-if="libraryBook.rating" style="text-align: center; margin-top: 8px;">
              <a-rate :value="libraryBook.rating" disabled style="font-size: 16px;" />
            </div>

            <a-button block size="large" class="add-btn" @click="$router.push('/library')">
              <ReadOutlined /> Mở trong tủ sách
            </a-button>
          </template>
        </a-col>

        <!-- Cột phải: thông tin -->
        <a-col :xs="24" :md="16" style="padding: 40px;">
          <a-typography-title :level="2" style="margin-bottom: 8px; font-weight: 800;">
            {{ book.title }}
          </a-typography-title>
          <a-typography-text type="secondary" style="font-size: 16px; display: block; margin-bottom: 32px;">
            Tác giả: {{ book.authors || 'Chưa cập nhật' }}
          </a-typography-text>

          <a-descriptions bordered :column="1" size="middle" style="margin-bottom: 32px;">
            <a-descriptions-item label="Mã sách (Work ID)">
              <strong>{{ book.work_id }}</strong>
            </a-descriptions-item>
            <a-descriptions-item label="Năm xuất bản">{{ book.publish_year || 'Chưa rõ' }}</a-descriptions-item>
            <a-descriptions-item label="Tổng số trang">
              <template v-if="book.total_pages > 0">{{ book.total_pages }} trang</template>
              <a-tooltip v-else title="Open Library không cung cấp số trang cho cuốn sách này">
                <span style="color: #faad14;">Chưa rõ</span>
              </a-tooltip>
            </a-descriptions-item>
          </a-descriptions>

          <div style="margin-bottom: 32px;">
            <a-typography-title :level="5" style="margin-bottom: 12px;">Chủ đề</a-typography-title>
            <a-space wrap>
              <a-tag
                v-for="subject in subjectList"
                :key="subject"
                color="processing"
                style="padding: 4px 12px; font-size: 14px; border-radius: 16px;"
              >
                {{ subject }}
              </a-tag>
            </a-space>
          </div>

          <div>
            <a-typography-title :level="5" style="margin-bottom: 12px;">Mô tả nội dung</a-typography-title>
            <div class="description-box">
              <a-typography-paragraph style="white-space: pre-line; line-height: 1.8; margin: 0; font-size: 15px;">
                {{ book.description || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này trên Open Library.' }}
              </a-typography-paragraph>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <AddToLibraryModal
      v-model:open="addModalOpen"
      :work-id="workId"
      :book-title="book?.title"
      @added="fetchLibraryBook"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue'
import { getBookDetail } from '../api/bookApi'
import { getLibrary } from '../api/libraryApi'
import { hasProgress, progressPercent, statusColor, statusLabel } from '../utils/book'
import BookCover from '../components/BookCover.vue'
import AddToLibraryModal from '../components/AddToLibraryModal.vue'

const route = useRoute()
const workId = computed(() => route.params.workId)

const book = ref(null)
const libraryBook = ref(null)
const isLoading = ref(true)
const error = ref('')
const addModalOpen = ref(false)

const subjectList = computed(() => {
  const raw = book.value?.subjects
  return raw ? raw.split(', ').filter(Boolean) : ['Chưa có thông tin']
})

const fetchLibraryBook = async () => {
  try {
    const res = await getLibrary()
    libraryBook.value = (res.data ?? []).find((b) => b.work_id === workId.value) ?? null
  } catch {
    // Khong chan duoc thi bo qua, van hien nut "Them vao tu"
    libraryBook.value = null
  }
}

const fetchData = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await getBookDetail(workId.value)
    book.value = res.data
    await fetchLibraryBook()
  } catch (err) {
    error.value = err.message
    book.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)
watch(workId, fetchData)
</script>

<style scoped>
.custom-detail-card {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  overflow: hidden;
}
.left-col {
  background: #fafafa;
  padding: 40px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
}
.cover-container {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.add-btn {
  border-radius: 8px;
  font-weight: bold;
  height: 48px;
  font-size: 16px;
  margin-top: 24px;
}
.in-library-tag {
  margin-top: 24px;
  padding: 4px 14px;
  font-size: 14px;
  border-radius: 16px;
}
.progress-box {
  margin-top: 16px;
  text-align: left;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.description-box {
  background: #f9f9f9;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}
</style>
