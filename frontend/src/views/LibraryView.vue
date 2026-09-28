<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <a-typography-title :level="2" style="margin: 0;">Tủ Sách Của Tôi</a-typography-title>
      <a-space>
        <a-button :loading="isLoading" @click="fetchLibrary">
          <ReloadOutlined /> Làm mới
        </a-button>
        <a-button type="primary" @click="$router.push('/')">
          <PlusOutlined /> Thêm sách
        </a-button>
      </a-space>
    </div>

    <!-- Error state -->
    <a-alert
      v-if="error"
      type="error"
      show-icon
      message="Không tải được tủ sách"
      :description="error"
      style="margin-bottom: 24px; border-radius: 8px;"
    >
      <template #action>
        <a-button size="small" danger @click="fetchLibrary">Thử lại</a-button>
      </template>
    </a-alert>

    <!-- Loading state -->
    <div v-if="isLoading && library.length === 0" style="text-align: center; padding: 80px 0;">
      <a-spin size="large" tip="Đang tải tủ sách..." />
    </div>

    <template v-else>
      <!-- Thống kê -->
      <a-row :gutter="24" style="margin-bottom: 32px;">
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card">
            <a-statistic title="Tổng số sách" :value="library.length">
              <template #prefix><BookOutlined style="color: #8c8c8c" /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card">
            <a-statistic
              title="Đang đọc"
              :value="readingCount"
              :value-style="{ color: '#1890ff', fontWeight: 'bold' }"
            >
              <template #prefix><ReadOutlined style="color: #1890ff" /></template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card class="stat-card">
            <a-statistic
              title="Đã đọc xong"
              :value="readCount"
              :value-style="{ color: '#52c41a', fontWeight: 'bold' }"
            >
              <template #prefix><CheckCircleOutlined style="color: #52c41a" /></template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-card :bordered="false" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <a-tabs v-model:activeKey="currentTab" size="large">
          <a-tab-pane key="ALL" :tab="`Tất cả (${library.length})`" />
          <a-tab-pane key="WANT_TO_READ" :tab="`Muốn đọc (${countBy('WANT_TO_READ')})`" />
          <a-tab-pane key="READING" :tab="`Đang đọc (${countBy('READING')})`" />
          <a-tab-pane key="READ" :tab="`Đã đọc (${countBy('READ')})`" />
        </a-tabs>

        <a-empty
          v-if="filteredLibrary.length === 0"
          description="Chưa có sách nào trong mục này."
          style="margin: 60px 0;"
        >
          <a-button type="primary" @click="$router.push('/')">Tìm sách ngay</a-button>
        </a-empty>

        <a-row v-else :gutter="[24, 24]" style="margin-top: 16px;">
          <a-col
            :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
            v-for="book in filteredLibrary"
            :key="book.id"
          >
            <a-spin :spinning="updatingId === book.id">
              <a-card hoverable class="lib-book-card" :bodyStyle="{ padding: '16px' }">
                <template #cover>
                  <div style="position: relative; cursor: pointer;" @click="$router.push(`/book/${book.work_id}`)">
                    <BookCover :cover-id="book.cover_id" :title="book.title" height="240px" />
                    <a-tag :color="statusColor(book.status)" class="status-badge">
                      {{ statusLabel(book.status) }}
                    </a-tag>
                  </div>
                </template>

                <div style="cursor: pointer;" @click="$router.push(`/book/${book.work_id}`)">
                  <a-typography-paragraph :ellipsis="{ rows: 2 }" :content="book.title" class="card-title" />
                  <a-typography-text :ellipsis="true" :content="book.authors || 'Tác giả ẩn danh'" style="font-size: 13px; display: block;" />
                </div>

                <!-- Tiến độ -->
                <div style="margin-top: 12px;">
                  <template v-if="hasProgress(book)">
                    <div class="progress-label">
                      <span>{{ book.current_page }} / {{ book.total_pages }}</span>
                      <span>{{ progressPercent(book) }}%</span>
                    </div>
                    <a-progress
                      :percent="progressPercent(book)"
                      size="small"
                      :status="book.status === 'READ' ? 'success' : 'normal'"
                      :show-info="false"
                    />
                  </template>
                  <a-tooltip v-else title="Open Library không có số trang cho sách này">
                    <a-typography-text type="secondary" style="font-size: 12px;">
                      Không theo dõi được tiến độ
                    </a-typography-text>
                  </a-tooltip>

                  <div v-if="book.rating" style="margin-top: 4px;">
                    <a-rate :value="book.rating" disabled style="font-size: 13px;" />
                  </div>
                </div>

                <a-space style="margin-top: 12px; width: 100%;" :size="8">
                  <a-button size="small" type="primary" ghost @click="openEditModal(book)">
                    <EditOutlined /> Cập nhật
                  </a-button>
                  <a-popconfirm
                    title="Xóa cuốn sách này khỏi tủ?"
                    ok-text="Xóa"
                    cancel-text="Hủy"
                    :ok-button-props="{ danger: true }"
                    @confirm="handleDelete(book)"
                  >
                    <a-button size="small" danger>
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </a-card>
            </a-spin>
          </a-col>
        </a-row>
      </a-card>
    </template>

    <!-- Modal cập nhật -->
    <a-modal
      v-model:open="editModalOpen"
      title="Cập nhật tiến độ đọc"
      ok-text="Lưu thay đổi"
      cancel-text="Hủy"
      :confirm-loading="saving"
      @ok="handleSave"
    >
      <template v-if="editingBook">
        <a-typography-paragraph style="font-weight: 600; font-size: 16px; margin-bottom: 20px;">
          {{ editingBook.title }}
        </a-typography-paragraph>

        <a-form layout="vertical">
          <a-form-item label="Trạng thái">
            <a-select v-model:value="form.status" :options="STATUS_OPTIONS" />
          </a-form-item>

          <a-form-item label="Số trang đã đọc">
            <a-input-number
              v-model:value="form.current_page"
              :min="0"
              :max="hasProgress(editingBook) ? editingBook.total_pages : undefined"
              :disabled="!hasProgress(editingBook)"
              style="width: 100%;"
              :placeholder="hasProgress(editingBook) ? `0 - ${editingBook.total_pages}` : 'Không rõ tổng số trang'"
            />
            <a-typography-text
              v-if="progressHint"
              :type="progressHint.type"
              style="font-size: 12px; display: block; margin-top: 4px;"
            >
              {{ progressHint.text }}
            </a-typography-text>
          </a-form-item>

          <a-form-item label="Đánh giá của bạn">
            <a-rate v-model:value="form.rating" allow-clear />
          </a-form-item>

          <a-form-item label="Ghi chú">
            <a-textarea v-model:value="form.note" :rows="3" placeholder="Cảm nhận của bạn về cuốn sách..." />
          </a-form-item>

          <a-form-item v-if="editingBook.started_at || editingBook.completed_at">
            <a-space direction="vertical" :size="0">
              <a-typography-text type="secondary" style="font-size: 12px;">
                Bắt đầu đọc: {{ formatDate(editingBook.started_at) }}
              </a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px;">
                Đọc xong: {{ formatDate(editingBook.completed_at) }}
              </a-typography-text>
            </a-space>
          </a-form-item>
        </a-form>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  BookOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { getLibrary, updateBook, deleteBook } from '../api/libraryApi'
import {
  STATUS_OPTIONS,
  hasProgress,
  progressPercent,
  statusColor,
  statusLabel,
} from '../utils/book'
import BookCover from '../components/BookCover.vue'

const library = ref([])
const isLoading = ref(false)
const error = ref('')
const currentTab = ref('ALL')
const updatingId = ref(null)

const editModalOpen = ref(false)
const editingBook = ref(null)
const saving = ref(false)
const form = reactive({ status: 'WANT_TO_READ', current_page: 0, rating: 0, note: '' })

const countBy = (status) => library.value.filter((b) => b.status === status).length
const readingCount = computed(() => countBy('READING'))
const readCount = computed(() => countBy('READ'))

const filteredLibrary = computed(() =>
  currentTab.value === 'ALL'
    ? library.value
    : library.value.filter((b) => b.status === currentTab.value)
)

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có'

const fetchLibrary = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await getLibrary()
    library.value = res.data ?? []
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Backend tu suy trang thai theo tien do, nen bao truoc cho nguoi dung
const progressHint = computed(() => {
  const book = editingBook.value
  if (!book) return null
  if (form.status === 'WANT_TO_READ' && book.status !== 'WANT_TO_READ') {
    return { type: 'warning', text: 'Chuyển về "Muốn đọc" sẽ đặt số trang đã đọc về 0.' }
  }
  if (hasProgress(book) && form.current_page === book.total_pages) {
    return { type: 'success', text: 'Đã đọc xong — trạng thái sẽ tự chuyển thành "Đã đọc".' }
  }
  if (form.current_page > 0 && form.status === 'WANT_TO_READ') {
    return { type: 'secondary', text: 'Có tiến độ — trạng thái sẽ tự chuyển thành "Đang đọc".' }
  }
  return null
})

// Giu dung bat bien: muon doc thi khong co tien do
watch(
  () => form.status,
  (val) => {
    if (val === 'WANT_TO_READ') form.current_page = 0
  }
)

const openEditModal = (book) => {
  editingBook.value = book
  form.status = book.status
  form.current_page = book.current_page
  form.rating = book.rating ?? 0
  form.note = book.note ?? ''
  editModalOpen.value = true
}

const handleSave = async () => {
  const book = editingBook.value
  saving.value = true
  try {
    const payload = {
      current_page: form.current_page ?? 0,
      rating: form.rating || null,
      note: form.note,
    }
    // Chi gui status khi nguoi dung chu dong doi, de tien do quyet dinh
    // trang thai trong truong hop de nguyen dropdown
    if (form.status !== book.status) payload.status = form.status

    const res = await updateBook(book.id, payload)
    const index = library.value.findIndex((b) => b.id === book.id)
    if (index !== -1) library.value[index] = res.data

    if (res.data.status === 'READ' && book.status !== 'READ') {
      message.success('Chúc mừng! Bạn đã đọc xong cuốn sách này.')
    } else {
      message.success('Cập nhật thành công')
    }
    editModalOpen.value = false
  } catch (err) {
    message.error(err.message)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (book) => {
  updatingId.value = book.id
  try {
    await deleteBook(book.id)
    library.value = library.value.filter((b) => b.id !== book.id)
    message.success(`Đã xóa "${book.title}" khỏi tủ sách`)
  } catch (err) {
    message.error(err.message)
  } finally {
    updatingId.value = null
  }
}

onMounted(fetchLibrary)
</script>

<style scoped>
.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.lib-book-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  height: 100%;
}
.lib-book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}
.card-title {
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}
.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  margin: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
</style>
