<template>
  <div class="user-dropdown">
    <Popover trigger="mouseenter" placement="bottom-end" :offset="4">
      <template #content>
        <div class="user-menu">
          <div class="user-info-section">
            <div class="user-icon-wrapper">
              <IconUser class="user-icon" />
            </div>
            <div class="user-details">
              <div class="user-name">{{ displayName }}</div>
              <div class="user-email">{{ userEmail }}</div>
            </div>
          </div>
          <Divider :margin="8" />
          <PopoverMenuItem class="menu-item logout" @click="handleLogout">
            <IconLogout class="icon" />
            <span>退出登录</span>
          </PopoverMenuItem>
        </div>
      </template>
      <div class="user-avatar">
        <IconUser class="avatar-icon" />
      </div>
    </Popover>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/auth'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Divider from '@/components/Divider.vue'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// 用户显示名称（优先使用 name，否则使用 email 的用户名部分）
const displayName = computed(() => {
  if (user.value?.name) return user.value.name
  if (user.value?.email) {
    return user.value.email.split('@')[0]
  }
  return '用户'
})

// 用户邮箱
const userEmail = computed(() => {
  return user.value?.email || ''
})

// 处理退出登录
async function handleLogout() {
  await authStore.logout()
  // 跳转到登录页
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.user-dropdown {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  .avatar-icon {
    font-size: 14px;
    color: #666;
  }

  &:hover {
    background: #e8e8e8;

    .avatar-icon {
      color: #333;
    }
  }
}

.user-menu {
  width: 220px;
  padding: 8px 0;
}

.user-info-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;

  .user-icon-wrapper {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .user-icon {
      font-size: 20px;
      color: #fff;
    }
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-email {
    font-size: 12px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  .icon {
    font-size: 18px;
    margin-right: 10px;
    color: #666;
  }

  span {
    font-size: 14px;
    color: #333;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.logout {
    &:hover {
      background-color: #fff2f0;

      .icon {
        color: #ff4d4f;
      }

      span {
        color: #ff4d4f;
      }
    }
  }
}
</style>
