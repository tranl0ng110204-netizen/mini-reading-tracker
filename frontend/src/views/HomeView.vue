<template>
  <div>
    <!-- Hero Search Area -->
    <div class="hero">
      <a-typography-title :level="1" style="font-weight: 800; margin-bottom: 16px;">
        Khám phá thế giới sách
      </a-typography-title>
      <a-typography-paragraph type="secondary" style="font-size: 16px; margin-bottom: 32px;">
        Tìm kiếm và lưu trữ những cuốn sách bạn yêu thích vào góc đọc sách của riêng mình.
      </a-typography-paragraph>

      <a-input-search
        v-model:value="searchQuery"
        placeholder="Nhập tên sách hoặc tác giả (Ví dụ: Harry Potter)..."
        enter-button="Tìm kiếm"
        size="large"
        :loading="isLoading"
        @search="handleSearch"
        style="max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;"
      />
    </div>

    <!-- Error state -->
    <a-alert
      v-if="error"
      type="error"
      show-icon
      :message="'Tìm kiếm thất bại'"
      :description="error"
      style="margin-bottom: 24px; border-radius: 8px;"
    >
      <template #action>
        <a-button size="small" danger @click="runSearch(activeQuery, currentPage)">Thử lại</a-button>
      </template>
    </a-alert>

    <!-- Loading state -->
    <div v-if="isLoading" style="text-align: center; padding: 50px 0;">
      <a-spin size="large" tip="Đang tìm kiếm..." />
    </div>

    <template v-else-if="!error">
      <!-- Empty state -->
      <a-empty
        v-if="searched && books.length === 0"
        :description="`Không tìm thấy kết quả nào cho '${activeQuery}'. Hãy thử từ khóa khác nhé!`"
        style="margin-top: 50px;"
      />

      <template v-else-if="books.length > 0">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <a-typography-text type="secondary">
            Tìm thấy <strong>{{ totalFound }}</strong> kết quả cho "<strong>{{ activeQuery }}</strong>"
          </a-typography-text>
        </div>

        <a-row :gutter="[24, 32]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" v-for="book in books" :key="book.work_id">
            <a-card hoverable class="book-card" :bodyStyle="{ padding: '16px' }">
              <template #cover>
                <div style="position: relative; cursor: pointer;" @click="goToDetail(book.work_id)">
                  <BookCover :cover-id="book.cover_id" :title="book.title" height="240px" />
                  <a-tag v-if="book.isAdded" color="success" class="added-badge">
                    <CheckCircleOutlined /> Đã thêm
                  </a-tag>
                </div>
              </template>

              <div class="card-body" @click="goToDetail(book.work_id)">
                <a-typography-paragraph :ellipsis="{ rows: 2 }" :content="book.title" class="card-title" />
                <a-typography-text :ellipsis="true" :content="book.authors || 'Tác giả ẩn danh'" style="font-size: 13px; display: block;" />
                <a-typography-text v-if="book.publish_year" type="secondary" style="font-size: 12px; display: block;">
                  {{ book.publish_year }}
                </a-typography-text>
              </div>

              <a-button
                type="primary"
                block
                :ghost="!book.isAdded"
                :disabled="book.isAdded"
                style="margin-top: 12px; border-radius: 6px;"
                @click.stop="openAddModal(book)"
              >
                {{ book.isAdded ? 'Đã có trong tủ' : '+ Thêm vào tủ' }}
              </a-button>
            </a-card>
          </a-col>
        </a-row>

        <!-- Pagination -->
        <div style="text-align: center; margin-top: 40px;">
          <a-pagination
            :current="currentPage"
            :total="totalFound"
            :page-size="PAGE_SIZE"
            :show-size-changer="false"
            @change="handlePageChange"
          />
        </div>
      </template>
    </template>

    <AddToLibraryModal
      v-model:open="addModalOpen"
      :work-id="selectedBook?.work_id"
      :book-title="selectedBook?.title"
      @added="handleAdded"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import { searchBooks } from '../api/bookApi'
import { workIdFromKey } from '../utils/book'
import BookCover from '../components/BookCover.vue'
import AddToLibraryModal from '../components/AddToLibraryModal.vue'

const PAGE_SIZE = 20

const router = useRouter()

const searchQuery = ref('')
const activeQuery = ref('')
const books = ref([])
const isLoading = ref(false)
const error = ref('')
const searched = ref(false)
const currentPage = ref(1)
const totalFound = ref(0)

const addModalOpen = ref(false)
const selectedBook = ref(null)

const normalize = (doc) => ({
  work_id: workIdFromKey(doc.key),
  title: doc.title,
  authors: Array.isArray(doc.author_name) ? doc.author_name.slice(0, 3).join(', ') : '',
  cover_id: doc.cover_i ?? null,
  publish_year: doc.first_publish_year ?? null,
  isAdded: !!doc.isAdded,
})

const runSearch = async (keyword, page = 1) => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await searchBooks(keyword, page)
    const data = res.data ?? {}
    books.value = (data.docs ?? []).map(normalize)
    totalFound.value = data.numFound ?? 0
    currentPage.value = page
    activeQuery.value = keyword
    searched.value = true
  } catch (err) {
    error.value = err.message
    books.value = []
    totalFound.value = 0
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  const keyword = searchQuery.value.trim()
  if (!keyword) {
    message.warning('Vui lòng nhập từ khóa tìm kiếm')
    return
  }
  runSearch(keyword, 1)
}

const handlePageChange = (page) => {
  runSearch(activeQuery.value, page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (workId) => router.push(`/book/${workId}`)

const openAddModal = (book) => {
  selectedBook.value = book
  addModalOpen.value = true
}

const handleAdded = (workId) => {
  const target = books.value.find((b) => b.work_id === workId)
  if (target) target.isAdded = true
}
</script>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 48px;
  padding: 40px 0;
}
.book-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}
.card-body {
  cursor: pointer;
  min-height: 78px;
}
.card-title {
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}
.added-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  margin: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
