<template>
  <a-layout style="min-height: 100vh; background: #f0f2f5;">
    <!-- Navbar -->
    <a-layout-header style="background: #fff; padding: 0 10%; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100;">
      <div style="font-size: 1.5rem; font-weight: bold; cursor: pointer; color: #1890ff; display: flex; align-items: center; gap: 8px;" @click="$router.push('/')">
        <BookOutlined /> Mini Tracker
      </div>
      <a-menu
        mode="horizontal"
        :selectedKeys="[currentRouteName]"
        style="border-bottom: none; flex: 1; justify-content: flex-end; font-size: 16px;"
      >
        <a-menu-item key="home">
          <router-link to="/"><SearchOutlined /> Tìm Sách</router-link>
        </a-menu-item>
        <a-menu-item key="library">
          <router-link to="/library"><ReadOutlined /> Tủ Sách</router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    
    <!-- Main Content -->
    <a-layout-content style="padding: 40px 10%; width: 100%; max-width: 1400px; margin: 0 auto;">
      <router-view />
    </a-layout-content>

    <!-- Footer -->
    <a-layout-footer style="text-align: center; color: #888;">
      Mini Reading Tracker ©2026 Created with Ant Design Vue
    </a-layout-footer>
  </a-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BookOutlined, SearchOutlined, ReadOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const currentRouteName = computed(() => route?.name || 'home')
</script>
