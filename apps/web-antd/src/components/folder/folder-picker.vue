<script lang="ts" setup>
import type { SelectProps } from 'ant-design-vue';

import type { FolderApi } from '#/api/core/folder';

import { defineExpose, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
  folderTree: {
    type: Array as () => FolderApi.Folder[],
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledFolder: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const selectedValue = ref(props.modelValue);
const treeOptions = ref<any[]>([]);

// 监听外部 value 变化
watch(
  () => props.modelValue,
  (newVal) => {
    selectedValue.value = newVal;
  },
  { immediate: true },
);

// 监听外部 folderTree/disabledFolder 变化
watch(
  [() => props.folderTree, () => props.disabledFolder],
  () => {
    treeOptions.value = buildFolderTree(props.folderTree);
  },
  { immediate: true },
);

// 辅助函数：将扁平数组转为树结构
function buildFolderTree(
  folders: FolderApi.Folder[],
  parentId: string | undefined = undefined,
  level = 0,
  parentPrefix = '',
): Array<any> {
  let result: Array<any> = [];
  const children = folders.filter((folder) => folder.parentId === parentId);
  for (const node of children) {
    const shouldFilter =
      props.disabledFolder && node.id === props.disabledFolder;
    const isSystemFolder = node.type === 'system';
    const currentPrefix =
      level > 0 ? `${parentPrefix + '│'.repeat(level > 1 ? 1 : 0)}└─ ` : '';
    const option = {
      label:
        currentPrefix + node.name + (isSystemFolder ? ' (系统文件夹)' : ''),
      value: node.id,
      disabled: isSystemFolder || node.id === props.disabledFolder,
    };
    if (shouldFilter) {
      // 跳过当前节点，但递归其子节点
      const childOptions = buildFolderTree(
        folders,
        node.id,
        level + 1,
        currentPrefix,
      );
      result = [...result, ...childOptions];
    } else {
      result.push(option);
      const childOptions = buildFolderTree(
        folders,
        node.id,
        level + 1,
        currentPrefix,
      );
      result = [...result, ...childOptions];
    }
  }
  return result;
}

// 处理选择变更
const handleChange: SelectProps['onChange'] = (value) => {
  const folderIdValue = value as string;
  emit('update:modelValue', folderIdValue);
  emit('change', folderIdValue);
};

// 暴露方法：允许外部强制刷新树形选项
function updateTree(newTree: FolderApi.Folder[]) {
  treeOptions.value = buildFolderTree(newTree);
}
defineExpose({ updateTree });
</script>

<template>
  <Select
    v-model:value="selectedValue"
    placeholder="请选择文件夹"
    class="w-full"
    :disabled="disabled"
    @change="handleChange"
    allow-clear
    :options="treeOptions"
  />
</template>
