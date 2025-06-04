<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';

import { ref } from 'vue';

import { UploadOutlined } from '@ant-design/icons-vue';
import { message, Modal, Progress, UploadDragger } from 'ant-design-vue';

import { uploadLiteratureApi } from '#/api/core/literature';

const props = defineProps<{
  folderId: string;
  topicId?: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success', literatureId?: string): void;
}>();

const uploading = ref(false);
const fileList = ref<UploadFile[]>([]);
const uploadedCount = ref(0);
const totalProgress = ref(0);

function resetState() {
  fileList.value = [];
  uploadedCount.value = 0;
  totalProgress.value = 0;
}

function checkFileSize(file: UploadFile) {
  const sizeMB = (file.originFileObj?.size ?? 0) / 1024 / 1024;
  if (sizeMB > 30) {
    message.error(`文件 ${file.name} 大小超过30MB，请重新选择`);
    return false;
  }
  return true;
}

const handleCancel = () => {
  resetState();
  emit('update:visible', false);
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.error('请选择要上传的文件');
    return;
  }
  if (!fileList.value.every((e) => checkFileSize(e))) return;

  uploading.value = true;
  uploadedCount.value = 0;
  totalProgress.value = 0;
  let lastUploadedLiteratureId = '';

  for (let i = 0; i < fileList.value.length; i++) {
    uploadedCount.value = i + 1;
    const file = fileList.value[i]!;
    try {
      if (!file.originFileObj) {
        message.error(`文件 ${file.name} 无效，未找到原始文件对象`);
        continue;
      }
      const response = await uploadLiteratureApi({
        file: file.originFileObj,
        folder_id: props.folderId,
        topic_id: props.topicId,
      });
      if (response?.literature_id)
        lastUploadedLiteratureId = response.literature_id;
      totalProgress.value = Math.round(((i + 1) / fileList.value.length) * 100);
    } catch {
      message.error(`文件 ${file.name} 上传失败`);
    }
  }

  if (uploadedCount.value === fileList.value.length) {
    message.success('所有文件上传成功');
    emit('success', lastUploadedLiteratureId);
    handleCancel();
  }
  uploading.value = false;
};

const handleChange = (info: UploadChangeParam) => {
  if (info.file && !checkFileSize(info.file)) return;
  fileList.value = info.fileList;
};
</script>

<template>
  <Modal
    :visible="visible"
    title="上传文献"
    @cancel="handleCancel"
    @ok="handleUpload"
    :confirm-loading="uploading"
  >
    <UploadDragger
      accept=".pdf"
      v-model:file-list="fileList"
      :before-upload="() => false"
      @change="handleChange"
      :multiple="true"
    >
      <template #default>
        <p class="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">支持PDF文件，单个文件大小不超过30MB</p>
      </template>
    </UploadDragger>
    <div v-if="uploading" class="mt-4 rounded bg-gray-100 p-3">
      <div class="mb-2 text-sm text-gray-600">
        <span> 正在上传: {{ uploadedCount }}/{{ fileList.length }}个文件 </span>
      </div>
      <div class="mt-2">
        <Progress :percent="totalProgress" status="active" />
      </div>
    </div>
  </Modal>
</template>
