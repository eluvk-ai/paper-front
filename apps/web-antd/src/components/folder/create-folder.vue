<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { FolderApi } from '#/api/core/folder';

import { reactive, ref, watch } from 'vue';

import {
  BookOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons-vue';
import {
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
} from 'ant-design-vue';

import {
  createFolderApi,
  getFolderIconOptions,
  updateFolderApi,
} from '#/api/core/folder';

import ColorPicker from './color-picker.vue';
import FolderPicker from './folder-picker.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  folderData: {
    type: Object as () => null | Partial<FolderApi.Folder>,
    default: null,
  },
  isCreating: {
    type: Boolean,
    default: true,
  },
  parentFolderId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:visible', 'success']);

const formRef = ref();
const confirmLoading = ref(false);
const folderIconOptions = getFolderIconOptions();

// 图标映射
const folderIconMap = {
  folder: FolderOutlined,
  star: StarOutlined,
  'clock-circle': ClockCircleOutlined,
  'question-circle': QuestionCircleOutlined,
  book: BookOutlined,
};

type FolderIconName = keyof typeof folderIconMap;

const getFolderIcon = (iconName: string) => {
  return iconName && folderIconMap[iconName as FolderIconName]
    ? folderIconMap[iconName as FolderIconName]
    : FolderOutlined;
};

// 表单数据
const formState = reactive({
  name: '',
  parentId: props.parentFolderId || undefined,
  description: '',
  icon: 'folder',
  color: '#1890ff',
  is_pinned: false,
  sort_order: 0,
});
// 表单验证规则
const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入文件夹名称', trigger: 'blur' }],
};

// 监听 folderData 变化
watch(
  () => props.folderData,
  (newVal) => {
    if (newVal) {
      Object.keys(formState).forEach((key) => {
        if (key in newVal) {
          formState[key] = newVal[key];
        }
      });
    } else {
      // 重置表单
      formState.name = '';
      formState.parentId = props.parentFolderId || undefined;
      formState.description = '';
      formState.icon = 'folder';
      formState.color = '#1890ff';
      formState.is_pinned = false;
      formState.sort_order = 0;
    }
  },
  { immediate: true },
);

// 监听 parentFolderId 变化
watch(
  () => props.parentFolderId,
  (newVal) => {
    if (props.isCreating) {
      formState.parentId = newVal || undefined;
    }
  },
  { immediate: true },
);

// 处理取消
const handleCancel = () => {
  emit('update:visible', false);
};

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    confirmLoading.value = true;

    if (props.isCreating) {
      // 创建文件夹
      await createFolderApi(formState);
      message.success('文件夹创建成功');
    } else {
      // 更新文件夹
      await updateFolderApi(props.folderData.folder_id, formState);
      message.success('文件夹更新成功');
    }

    // 刷新文件夹树，确保新文件夹立即显示
    // 获取页面中所有的FolderSelect组件并触发它们的刷新方法
    const refreshFolders = () => {
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        // 尝试获取页面中的所有FolderSelect组件引用并刷新
        document.querySelectorAll('.ant-select').forEach((el) => {
          const vnode = (el as any).__vueParentComponent;
          if (
            vnode &&
            vnode.component &&
            vnode.component.exposed &&
            vnode.component.exposed.refresh
          ) {
            console.log('【文件夹表单】找到FolderSelect组件并刷新');
            vnode.component.exposed.refresh();
          }
        });
      }, 100);
    };

    refreshFolders();

    emit('success');
    emit('update:visible', false);
  } catch (error) {
    console.error('表单验证或提交失败:', error);
  } finally {
    confirmLoading.value = false;
  }
};
</script>

<template>
  <Modal
    :visible="visible"
    :title="isCreating ? '创建文件夹' : '编辑文件夹'"
    @cancel="handleCancel"
    @ok="handleSubmit"
    :confirm-loading="confirmLoading"
  >
    <Form :model="formState" :rules="rules" ref="formRef" layout="vertical">
      <Form.Item label="文件夹名称" name="name" required>
        <Input v-model:value="formState.name" placeholder="请输入文件夹名称" />
      </Form.Item>

      <Form.Item label="父文件夹" name="parentId">
        <FolderPicker
          v-model:model-value="formState.parentId"
          :disabled-folder="!isCreating ? folderData?.id : undefined"
        />
      </Form.Item>

      <Form.Item label="描述" name="description">
        <Input.TextArea
          v-model:value="formState.description"
          placeholder="请输入文件夹描述"
          :rows="3"
        />
      </Form.Item>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="图标" name="icon">
            <Select v-model:value="formState.icon" placeholder="请选择图标">
              <Select.Option
                v-for="icon in folderIconOptions"
                :key="icon.value"
                :value="icon.value"
              >
                <span class="icon-option">
                  <component :is="getFolderIcon(icon.value)" />
                  <span>{{ icon.label }}</span>
                </span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="颜色" name="color">
            <ColorPicker v-model:value="formState.color" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="is_pinned">
        <Checkbox v-model:checked="formState.is_pinned">置顶文件夹</Checkbox>
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.icon-option {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
