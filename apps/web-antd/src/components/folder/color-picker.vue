<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, Input } from 'ant-design-vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '#1890ff',
  },
  presetColors: {
    type: Array as () => string[],
    default: () => [
      '#1890ff', // 蓝色
      '#52c41a', // 绿色
      '#faad14', // 黄色
      '#f5222d', // 红色
      '#722ed1', // 紫色
      '#13c2c2', // 青色
      '#eb2f96', // 粉色
      '#fa8c16', // 橙色
      '#a0d911', // 浅绿色
      '#1d39c4', // 深蓝色
    ],
  },
});

const emit = defineEmits(['update:modelValue']);

const value = ref(props.modelValue);
const showPicker = ref(false);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    value.value = newVal;
  },
  { immediate: true },
);

// 处理输入框变化
const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value || '';
  value.value = val;
  emit('update:modelValue', val);
};

// 选择颜色
const selectColor = (color: string) => {
  value.value = color;
  emit('update:modelValue', color);
  showPicker.value = false;
};
</script>

<template>
  <div class="relative flex items-center gap-2">
    <div
      class="h-8 w-8 cursor-pointer rounded border border-gray-300"
      :style="{ backgroundColor: value }"
      @click="showPicker = !showPicker"
    ></div>
    <Input
      v-model:value="value"
      placeholder="#RRGGBB"
      @input="handleInput"
      class="min-w-0 flex-1"
    />
    <div
      v-if="showPicker"
      class="absolute left-0 top-10 z-50 w-56 rounded border border-gray-300 bg-white p-3 shadow-lg"
    >
      <div class="grid grid-cols-5 gap-2">
        <div
          v-for="color in presetColors"
          :key="color"
          class="h-6 w-6 cursor-pointer rounded border border-gray-300"
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        ></div>
      </div>
      <div class="mt-3 flex justify-end">
        <Button size="small" @click="showPicker = false">关闭</Button>
      </div>
    </div>
  </div>
</template>
