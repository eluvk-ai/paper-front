<script lang="ts" setup>
import type { FolderApi } from '#/api/core/folder';
import type { LiteratureModel } from '#/api/core/literature';

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  BookOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  FolderAddOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  StarOutlined,
  SyncOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import {
  Breadcrumb,
  Button,
  Card,
  Dropdown,
  Input,
  List,
  Menu,
  message,
  Modal,
  Pagination,
  Radio,
  Select,
  Spin,
  Tooltip,
  Tree,
} from 'ant-design-vue';

// import {
//   getFolderTreeApi,
//   getFolderDetailApi,
//   addLiteraturesToFolderApi,
//   removeLiteraturesFromFolderApi,
//   moveLiteratureBetweenFoldersApi,
//   deleteFolderApi,
//   getFolderLiteraturesApi,
//   updateFolderApi,
//   ensureUserFoldersInitializedApi,
//   refreshFolderStatisticsApi,
//   getLiteratureFieldOptions,
//   getOperatorOptions,
// } from '#/api/core/floder';
// import {
//   deleteLiteratureApi,
//   getLiteratureListApi,
//   getLiteratureDetailApi,
//   updatePdfInfoApi,
//   updateEndnoteInfoApi,
// } from '#/api/core/literature';
// import FolderFormModal from '#/components/Floder/FolderFormModal.vue';
// import MoveLiteratureModal from '#/components/Floder/MoveLiteratureModal.vue';
// import SmartFolderFormModal from '#/components/Floder/SmartFolderFormModal.vue';
// import EndnoteInfoEditor from '#/components/Literature/EndnoteInfoEditor.vue';
// import LiteratureCard from '#/components/Literature/LiteratureCard.vue';
// import LiteratureList from '#/components/Literature/LiteratureList.vue';
import UploadFile from '#/components/literature/upload-file.vue';

const router = useRouter();
const loading = ref(false);
const folderLoading = ref(false);
const literatureList = ref<LiteratureModel[]>([]);
const uploadModalVisible = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const searchKeyword = ref('');
const searchType = ref('title');
const folderSearchKeyword = ref('');
const viewMode = ref<'grid' | 'list'>('grid');

// 移动端相关状态
const isMobile = ref(false);
const activeTab = ref<'folders' | 'literatures'>('literatures');
const refreshingStats = ref(false);

// 文件夹相关状态
const folderTreeData = ref<FolderApi.FolderTreeNode[]>([]);
const selectedFolderId = ref<string>('');
const expandedKeys = ref<string[]>([]);
const folderPath = ref<FolderApi.FolderModel[]>([]);
const folderFormVisible = ref(false);
const smartFolderFormVisible = ref(false);
const isCreatingFolder = ref(true);
const editingFolder = ref<null | Partial<FolderApi.FolderModel>>(null);
const folderFormParentId = ref<string>('');

// 文献选择状态
const selectedLiteratureIds = ref<string[]>([]);
const moveLiteratureModalVisible = ref(false);

// 文献信息编辑相关状态
const currentEditingLiterature = ref<LiteratureModel | null>(null);
const showEndnoteEditor = ref(false);

// 图标映射
const folderIconMap: Record<string, any> = {
  folder: FolderOutlined,
  star: StarOutlined,
  'clock-circle': ClockCircleOutlined,
  'question-circle': QuestionCircleOutlined,
  book: BookOutlined,
  // 可以根据需要添加更多图标映射
};

// 文献列表计算属性
const filteredLiteratureList = computed(() => {
  if (!searchKeyword.value) {
    return literatureList.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return literatureList.value.filter((item) => {
    switch (searchType.value) {
      case 'filename': {
        return item.file_name.toLowerCase().includes(keyword);
      }
      case 'tags': {
        return (
          item.tags?.some((tag) => tag.toLowerCase().includes(keyword)) ?? false
        );
      }
      case 'title': {
        const titleToSearch = item.endnote_info?.Title || item.title || '';
        return titleToSearch.toLowerCase().includes(keyword);
      }
      default: {
        return false;
      }
    }
  });
});

const paginatedLiteratureList = computed(() => {
  const sortedList = [...filteredLiteratureList.value].sort((a, b) => {
    return (
      new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime()
    );
  });

  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return sortedList.slice(startIndex, endIndex);
});

const hasSelectedLiteratures = computed(
  () => selectedLiteratureIds.value.length > 0,
);

// 新增文献选择函数
const handleLiteratureSelect = (id: string) => {
  const index = selectedLiteratureIds.value.indexOf(id);
  if (index === -1) {
    // 如果未选中，添加到选中列表
    selectedLiteratureIds.value.push(id);
  } else {
    // 如果已选中，从选中列表中移除
    selectedLiteratureIds.value.splice(index, 1);
  }
};

// 处理文献点击事件
const handleLiteratureClick = (id: string) => {
  // 如果有文献被选中，则将点击事件转为选择操作
  if (hasSelectedLiteratures.value) {
    handleLiteratureSelect(id);
  } else {
    // 使用nextTick确保DOM更新完成后再执行路由跳转
    nextTick(() => {
      router.push(`/literature/detail/${id}`);
    });
  }
};

// 选择文件夹处理
const handleFolderSelect = (selectedKeys: any, info: any) => {
  if (selectedKeys.length > 0) {
    selectedFolderId.value = selectedKeys[0].toString();
    loadFolderDetail(selectedFolderId.value);
  }
};

// 展开文件夹处理
const handleFolderExpand = (keys: any, info: any) => {
  console.log('【文献页面】文件夹展开/折叠事件触发:', {
    expandedKeys: keys,
    node: info.node.id,
    expanded: info.expanded,
  });

  // 将keys转换为字符串数组再赋值给expandedKeys.value
  expandedKeys.value = keys.map(String);
};

// 下拉菜单可见性变化处理
const handleDropdownVisibleChange = (visible: boolean, folderId: string) => {
  // 可以根据需要处理下拉菜单显示/隐藏的逻辑
};

// 获取文件夹图标
const getFolderIcon = (iconName: string | undefined, type: string) => {
  if (type === 'smart') {
    return AppstoreAddOutlined;
  }

  if (iconName && folderIconMap[iconName]) {
    return folderIconMap[iconName];
  }

  return FolderOutlined;
};

// 加载文件夹树
const loadFolderTree = async () => {
  try {
    folderLoading.value = true;
    console.log('【文献页面】开始加载文件夹树');

    // 确保用户有默认文件夹
    await ensureUserFoldersInitializedApi();

    // 加载文件夹树
    const folders = await getFolderTreeApi();
    console.log('【文献页面】获取到文件夹树数据:', folders);

    // 统计文件夹类型
    let normalCount = 0;
    let systemCount = 0;
    let smartCount = 0;
    const countFolders = (nodes: FolderApi.FolderTreeNode[]) => {
      nodes.forEach((node) => {
        switch (node.type) {
          case 'normal': {
            normalCount++;
            break;
          }
          case 'smart': {
            smartCount++;
            break;
          }
          case 'system': {
            systemCount++;
            break;
          }
        }

        if (node.children && node.children.length > 0) {
          countFolders(node.children);
        }
      });
    };
    countFolders(folders);
    console.log('【文献页面】文件夹类型统计:', {
      normal: normalCount,
      system: systemCount,
      smart: smartCount,
      total: normalCount + systemCount + smartCount,
    });

    // 直接使用API返回的数据 - Tree组件会使用replaceFields进行属性映射
    folderTreeData.value = folders;

    // 如果没有选中的文件夹，则选择第一个
    if (!selectedFolderId.value && folders.length > 0 && folders[0]) {
      selectedFolderId.value = folders[0].id;
      console.log('【文献页面】自动选择第一个文件夹:', selectedFolderId.value);
      await loadFolderDetail(selectedFolderId.value);
    }

    // 只默认展开第一级
    expandedKeys.value = folders.map((f) => f.id);
  } catch (error) {
    console.error('【文献页面】加载文件夹树失败:', error);
    message.error('加载文件夹树失败');
  } finally {
    folderLoading.value = false;
  }
};

// 加载文件夹详情和文献列表
const loadFolderDetail = async (folderId: string) => {
  try {
    loading.value = true;

    // 清空当前选择
    clearSelection();

    // 清空现有数据
    literatureList.value = [];
    folderPath.value = [];

    // 获取文件夹详情
    const folderDetail = await getFolderDetailApi(folderId);
    folderPath.value = folderDetail.path;

    // 获取文件夹内的文献
    const literatures = await getFolderLiteraturesApi(folderId);

    // 确保所有文献都有明确的editable属性
    const processedLiteratures = literatures.map((lit: LiteratureModel) => {
      // 创建新对象，保留所有原始属性
      const processedLit = { ...lit };

      // 强制设置editable为布尔值，默认为true
      // 只有明确为false时才设为false
      processedLit.editable = processedLit.editable !== false;

      return processedLit;
    });

    literatureList.value = processedLiteratures;

    // 重置分页
    currentPage.value = 1;
  } catch (error) {
    console.error('加载文件夹详情失败:', error);
    message.error('加载文件夹详情失败');
  } finally {
    loading.value = false;
  }
};

// 处理面包屑点击
const handleFolderBreadcrumbClick = (folderId: string) => {
  selectedFolderId.value = folderId;
  loadFolderDetail(folderId);
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
};

// 处理搜索变化
const handleSearchChange = () => {
  if (!searchKeyword.value) {
    handleSearch();
  }
};

// 处理文件夹搜索
const handleFolderSearch = () => {
  // 这里使用的是计算属性，不需要额外处理
};

// 刷新当前视图
const refreshCurrentView = async () => {
  await loadFolderDetail(selectedFolderId.value);
};

// 检查文献是否被选中
const isLiteratureSelected = (literatureId: string) => {
  return selectedLiteratureIds.value.includes(literatureId);
};

// 切换文献选择状态
const toggleLiteratureSelection = (literatureId: string) => {
  const index = selectedLiteratureIds.value.indexOf(literatureId);
  if (index === -1) {
    selectedLiteratureIds.value.push(literatureId);
  } else {
    selectedLiteratureIds.value.splice(index, 1);
  }
};

// 清空选择
const clearSelection = () => {
  selectedLiteratureIds.value = [];
};

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 处理每页条数变化
const handlePageSizeChange = (current: number, size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 创建文件夹
const handleCreateFolder = () => {
  console.log(
    '【文献页面】开始创建普通文件夹，父文件夹:',
    selectedFolderId.value,
  );
  isCreatingFolder.value = true;
  editingFolder.value = null;
  folderFormParentId.value = selectedFolderId.value;
  folderFormVisible.value = true;
};

// 创建智能文件夹
const handleCreateSmartFolder = () => {
  console.log('【文献页面】开始创建智能文件夹');
  editingFolder.value = null;
  smartFolderFormVisible.value = true;
};

// 编辑文件夹
const handleEditFolder = async (folderId: string) => {
  try {
    folderLoading.value = true;
    const folderDetail = await getFolderDetailApi(folderId);
    editingFolder.value = folderDetail.folder;
    isCreatingFolder.value = false;
    folderFormVisible.value = true;
  } catch (error) {
    console.error('获取文件夹详情失败:', error);
    message.error('获取文件夹详情失败');
  } finally {
    folderLoading.value = false;
  }
};

// 删除文件夹
const handleDeleteFolder = (folderId: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '删除文件夹将不会删除其中的文献。确定要删除此文件夹吗？',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteFolderApi(folderId);
        message.success('文件夹删除成功');

        // 如果删除的是当前选中的文件夹，选中第一个文件夹
        if (folderId === selectedFolderId.value) {
          await loadFolderTree();
          if (folderTreeData.value.length > 0 && folderTreeData.value[0]) {
            selectedFolderId.value = folderTreeData.value[0].id;
            await loadFolderDetail(selectedFolderId.value);
          }
        } else {
          // 仅重新加载文件夹树
          await loadFolderTree();
        }
      } catch (error) {
        console.error('删除文件夹失败:', error);
        message.error('删除文件夹失败');
      }
    },
  });
};

// 文件夹拖拽处理
const handleFolderDrop = async (info: any) => {
  try {
    const dragFolderId = info.dragNode.key || info.dragNode.id;
    const dropFolderId = info.dropNode.key || info.dropNode.id;

    // 不同的dropPosition表示不同的操作
    // 0 表示成为子节点，-1 表示放在目标节点前，1 表示放在目标节点后

    // 这里我们只实现"成为子节点"的情况
    if (info.dropPosition === 0) {
      await updateFolderApi(dragFolderId, {
        parent_folder_id: dropFolderId,
      });

      message.success('移动文件夹成功');
      await loadFolderTree();
    }
  } catch (error) {
    console.error('移动文件夹失败:', error);
    message.error('移动文件夹失败');
    await loadFolderTree(); // 重新加载以恢复原状
  }
};

// 处理文件夹表单提交成功
const handleFolderFormSuccess = async () => {
  console.log('【文献页面】文件夹表单提交成功，准备刷新文件夹树');
  await loadFolderTree();

  // 如果是编辑当前文件夹，重新加载详情
  if (
    !isCreatingFolder.value &&
    editingFolder.value?.folder_id === selectedFolderId.value
  ) {
    console.log('【文献页面】当前编辑的是选中文件夹，重新加载详情');
    await loadFolderDetail(selectedFolderId.value);
  }

  // 刷新移动文献弹窗内的文件夹选择器
  // 通过先关闭再打开的方式强制刷新
  if (moveLiteratureModalVisible.value) {
    console.log('【文献页面】文件夹更新后刷新移动文献模态框');
    moveLiteratureModalVisible.value = false;
    setTimeout(() => {
      moveLiteratureModalVisible.value = true;
    }, 100);
  }
};

// 批量操作
const handleBatchMove = () => {
  if (selectedLiteratureIds.value.length === 0) {
    message.warning('请先选择文献');
    return;
  }
  console.log(
    '【文献页面】打开移动文献模态框，当前选中文件夹:',
    selectedFolderId.value,
  );
  console.log(
    '【文献页面】当前选中文献数量:',
    selectedLiteratureIds.value.length,
  );
  moveLiteratureModalVisible.value = true;
};

const handleBatchRemoveFromFolder = () => {
  if (selectedLiteratureIds.value.length === 0) {
    message.warning('请先选择文献');
    return;
  }

  Modal.confirm({
    title: '从文件夹移除',
    content: `确定要从当前文件夹移除选中的 ${selectedLiteratureIds.value.length} 篇文献吗？`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      try {
        await removeLiteraturesFromFolderApi({
          literature_ids: selectedLiteratureIds.value,
          folder_id: selectedFolderId.value,
        });
        message.success('已从文件夹移除文献');
        clearSelection();
        await loadFolderDetail(selectedFolderId.value);
      } catch (error) {
        console.error('移除文献失败:', error);
        message.error('移除文献失败');
      }
    },
  });
};

const handleBatchDelete = () => {
  if (selectedLiteratureIds.value.length === 0) {
    message.warning('请先选择文献');
    return;
  }

  Modal.confirm({
    title: '批量删除文献',
    content: `确定要删除选中的 ${selectedLiteratureIds.value.length} 篇文献吗？此操作无法撤销。`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        // 逐个删除文献
        for (const literatureId of selectedLiteratureIds.value) {
          await deleteLiteratureApi(literatureId);
        }

        message.success(
          `成功删除 ${selectedLiteratureIds.value.length} 篇文献`,
        );
        clearSelection();
        await loadFolderDetail(selectedFolderId.value);
      } catch (error) {
        console.error('批量删除文献失败:', error);
        message.error('批量删除文献失败');
      }
    },
  });
};

// 处理移动文献成功
const handleMoveLiteratureSuccess = async () => {
  message.success('文献移动成功');
  clearSelection();

  // 先刷新文件夹统计信息
  await refreshFolderStats();

  // 然后刷新当前文件夹的文献列表
  await loadFolderDetail(selectedFolderId.value);
};

// 处理文献上传成功
const handleUploadSuccess = async (literatureId?: string) => {
  // 上传成功后，将新文献添加到当前文件夹（如果指定了文件夹）
  if (literatureId && selectedFolderId.value) {
    try {
      await addLiteraturesToFolderApi({
        literature_ids: [literatureId],
        folder_id: selectedFolderId.value,
      });
    } catch (error) {
      console.error('添加文献到文件夹失败:', error);
    }
  }

  // 刷新当前文件夹
  await loadFolderDetail(selectedFolderId.value);
};

// 查看文献详情
const handleViewDetail = (id: string) => {
  router.push(`/literature/detail/${id}`);
};

// 删除文献
const handleDelete = async (id: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这篇文献吗？此操作不可恢复。',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteLiteratureApi(id);
        message.success('删除成功');
        await loadFolderDetail(selectedFolderId.value);
      } catch (error) {
        console.error('删除文献失败:', error);
        message.error('删除文献失败');
      }
    },
  });
};

// 处理单个文献更新
const handleLiteratureUpdate = async (literatureId?: string) => {
  if (!literatureId) {
    await loadFolderDetail(selectedFolderId.value);
    return;
  }

  try {
    const updatedLiterature = await getLiteratureDetailApi(literatureId);

    // 调试信息 - 检查更新后的文献对象
    console.log('Updated literature check:', {
      id: updatedLiterature.literature_id,
      editable: updatedLiterature.editable,
      typeOfEditable: typeof updatedLiterature.editable,
    });

    // 确保editable属性是布尔值
    if (typeof updatedLiterature.editable !== 'boolean') {
      console.log(
        `Updated literature ${updatedLiterature.literature_id} has non-boolean editable: ${updatedLiterature.editable}`,
      );
      updatedLiterature.editable = !!updatedLiterature.editable;
    }

    const index = literatureList.value.findIndex(
      (item) => item.literature_id === literatureId,
    );
    if (index === -1) {
      await loadFolderDetail(selectedFolderId.value);
    } else {
      literatureList.value[index] = updatedLiterature;
      literatureList.value = [...literatureList.value];
    }
  } catch (error) {
    console.error('更新文献信息失败:', error);
    await loadFolderDetail(selectedFolderId.value);
  }
};

// 监听搜索类型变化
watch(searchType, () => {
  handleSearch();
});

// 检测是否为移动设备
const checkMobileDevice = () => {
  isMobile.value = window.innerWidth < 768;
};

// 处理窗口大小变化
const handleWindowResize = () => {
  checkMobileDevice();
};

// 切换移动端视图标签
const toggleMobileTab = (tab: 'folders' | 'literatures') => {
  activeTab.value = tab;
};

// 刷新文件夹统计信息
const refreshFolderStats = async () => {
  try {
    refreshingStats.value = true;
    await refreshFolderStatisticsApi();

    // 重新加载文件夹树
    await loadFolderTree();

    // 如果有选中的文件夹，重新加载文件夹详情
    if (selectedFolderId.value) {
      await loadFolderDetail(selectedFolderId.value);
    }

    message.success('文件夹统计信息刷新成功');
  } catch (error) {
    console.error('刷新文件夹统计信息失败:', error);
    message.error('刷新文件夹统计信息失败');
  } finally {
    refreshingStats.value = false;
  }
};

// 处理列表视图选择变化
const handleListSelectionChange = (selectedIds: string[]) => {
  selectedLiteratureIds.value = selectedIds;
};

// 编辑文献EndnoteInfo
const handleEditEndnoteInfo = async (literature: LiteratureModel) => {
  try {
    // 如果需要获取最新数据，可以先获取详细信息
    const updatedLiterature = await getLiteratureDetailApi(
      literature.literature_id,
    );

    // 打开编辑弹窗
    currentEditingLiterature.value = updatedLiterature;
    showEndnoteEditor.value = true;
  } catch (error) {
    console.error('获取文献详情失败:', error);
    message.error('获取文献详情失败');
  }
};

// 更新PDF信息
const handleUpdatePdfInfo = async (literature: LiteratureModel) => {
  try {
    message.loading('正在更新PDF信息...');
    await updatePdfInfoApi(literature.literature_id);
    message.success('PDF信息更新成功');
    // 刷新当前文件夹
    await loadFolderDetail(selectedFolderId.value);
  } catch (error) {
    console.error('更新PDF信息失败:', error);
    message.error('更新PDF信息失败');
  }
};

// 处理EndnoteInfo提交
const handleEndnoteInfoSubmit = async (endnoteInfo: any) => {
  try {
    if (currentEditingLiterature.value) {
      await updateEndnoteInfoApi(
        currentEditingLiterature.value.literature_id,
        endnoteInfo,
      );
      message.success('文献信息更新成功');
      showEndnoteEditor.value = false;
      await loadFolderDetail(selectedFolderId.value);
    }
  } catch (error) {
    console.error('更新文献信息失败:', error);
    message.error('更新文献信息失败');
  }
};

// 初始化
onMounted(async () => {
  // 检测设备类型
  checkMobileDevice();
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize);

  await loadFolderTree();
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});

// 转换文件夹树数据以符合Tree组件要求
const convertToTreeData = (folders: FolderApi.FolderTreeNode[]): any[] => {
  if (!folders || !Array.isArray(folders)) return [];

  return folders.map((folder) => {
    return {
      ...folder,
      key: folder.id,
      title: folder.name,
      children: folder.children ? convertToTreeData(folder.children) : [],
    };
  });
};
</script>

<template>
  <div class="literature-page">
    <!-- 移动端导航栏 -->
    <div v-if="isMobile" class="mobile-nav">
      <div class="mobile-tabs">
        <div
          class="mobile-tab"
          :class="{ active: activeTab === 'folders' }"
          @click="toggleMobileTab('folders')"
        >
          文件夹
        </div>
        <div
          class="mobile-tab"
          :class="{ active: activeTab === 'literatures' }"
          @click="toggleMobileTab('literatures')"
        >
          文献列表
        </div>
      </div>
    </div>

    <div class="literature-layout" :class="{ 'mobile-layout': isMobile }">
      <!-- 左侧文件夹树部分 -->
      <div
        class="folder-sidebar"
        :class="{ 'mobile-hidden': isMobile && activeTab !== 'folders' }"
      >
        <div class="sidebar-header">
          <h3>文件夹</h3>
          <div class="folder-actions">
            <Tooltip title="新建文件夹">
              <Button type="text" size="small" @click="handleCreateFolder">
                <template #icon><FolderAddOutlined /></template>
              </Button>
            </Tooltip>
            <Tooltip title="新建智能文件夹">
              <Button type="text" size="small" @click="handleCreateSmartFolder">
                <template #icon><AppstoreAddOutlined /></template>
              </Button>
            </Tooltip>
            <Tooltip title="刷新统计信息">
              <Button
                type="text"
                @click="refreshFolderStats"
                :loading="refreshingStats"
              >
                <template #icon><ReloadOutlined /></template>
              </Button>
            </Tooltip>
          </div>
        </div>

        <div class="folder-search">
          <Input.Search
            v-model:value="folderSearchKeyword"
            placeholder="搜索文件夹"
            size="small"
            @change="handleFolderSearch"
          />
        </div>

        <Spin :spinning="folderLoading">
          <div class="folder-tree-container">
            <Tree
              :tree-data="convertToTreeData(folderTreeData)"
              :selected-keys="[selectedFolderId]"
              :expanded-keys="expandedKeys"
              :replace-fields="{
                key: 'id',
                title: 'name',
                children: 'children',
              }"
              @select="handleFolderSelect"
              @expand="handleFolderExpand"
              :draggable="true"
              @drop="handleFolderDrop"
            >
              <template #title="{ id, name, icon, color, type, statistics }">
                <div class="custom-tree-node">
                  <span
                    class="folder-icon"
                    :style="{ color: color || '#1890ff' }"
                  >
                    <component :is="getFolderIcon(icon, type)" />
                  </span>
                  <span class="folder-name">{{ name }}</span>
                  <span class="folder-count">{{
                    statistics?.literature_count || 0
                  }}</span>

                  <Dropdown
                    v-if="type !== 'system'"
                    :trigger="['click']"
                    @visible-change="
                      (visible) => handleDropdownVisibleChange(visible, id)
                    "
                  >
                    <template #overlay>
                      <Menu>
                        <Menu.Item
                          key="edit"
                          @click="() => handleEditFolder(id)"
                        >
                          <EditOutlined /> 编辑文件夹
                        </Menu.Item>
                        <Menu.Item
                          key="delete"
                          danger
                          @click="() => handleDeleteFolder(id)"
                        >
                          <DeleteOutlined /> 删除文件夹
                        </Menu.Item>
                      </Menu>
                    </template>
                    <Button type="text" size="small">
                      <template #icon><EllipsisOutlined /></template>
                    </Button>
                  </Dropdown>
                </div>
              </template>
            </Tree>
          </div>
        </Spin>
      </div>

      <!-- 右侧文献列表部分 -->
      <div
        class="literature-content"
        :class="{ 'mobile-hidden': isMobile && activeTab !== 'literatures' }"
      >
        <Card :loading="loading" :bordered="false">
          <template #title>
            <div class="card-title">
              <div class="folder-path">
                <Breadcrumb>
                  <template
                    v-for="(folder, index) in folderPath"
                    :key="folder.folder_id"
                  >
                    <Breadcrumb.Item>
                      <a @click="handleFolderBreadcrumbClick(folder.folder_id)">
                        {{ folder.name }}
                      </a>
                    </Breadcrumb.Item>
                  </template>
                </Breadcrumb>
              </div>
              <div class="search-container">
                <Input.Search
                  v-model:value="searchKeyword"
                  placeholder="请输入搜索关键词"
                  enter-button
                  allow-clear
                  @search="handleSearch"
                  @change="handleSearchChange"
                  :style="isMobile ? 'width: 100%' : 'width: 300px'"
                />
                <Select
                  v-model:value="searchType"
                  :style="isMobile ? 'width: 100%' : 'width: 120px'"
                  @change="handleSearch"
                >
                  <Select.Option value="title">标题</Select.Option>
                  <Select.Option value="filename">文件名</Select.Option>
                  <Select.Option value="tags">标签</Select.Option>
                </Select>
              </div>
              <div class="actions-container">
                <Button type="primary" @click="uploadModalVisible = true">
                  <template #icon><UploadOutlined /></template>
                  <span v-if="!isMobile">上传文献</span>
                </Button>
                <Tooltip title="刷新列表">
                  <Button @click="refreshCurrentView" :loading="loading">
                    <template #icon><SyncOutlined /></template>
                  </Button>
                </Tooltip>
                <Dropdown v-if="hasSelectedLiteratures" :trigger="['click']">
                  <template #overlay>
                    <Menu>
                      <Menu.Item key="move" @click="handleBatchMove">
                        移动到其他文件夹
                      </Menu.Item>
                      <Menu.Item
                        key="remove"
                        @click="handleBatchRemoveFromFolder"
                      >
                        从当前文件夹移除
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key="delete" danger @click="handleBatchDelete">
                        批量删除
                      </Menu.Item>
                    </Menu>
                  </template>
                  <Button>
                    <template #icon><AppstoreOutlined /></template>
                    <span v-if="!isMobile">批量操作</span>
                    <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
            </div>
          </template>

          <div class="view-options">
            <Radio.Group v-model:value="viewMode" button-style="solid">
              <Radio.Button value="grid">卡片视图</Radio.Button>
              <Radio.Button value="list">列表视图</Radio.Button>
            </Radio.Group>

            <div class="selection-info" v-if="hasSelectedLiteratures">
              已选择 {{ selectedLiteratureIds.length }} 项
              <Button type="link" @click="clearSelection">清空</Button>
            </div>
          </div>

          <!-- 卡片视图 -->
          <List
            v-if="viewMode === 'grid'"
            :data-source="paginatedLiteratureList"
            :grid="
              isMobile
                ? { gutter: 8, column: 1 }
                : { gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4 }
            "
            :row-key="(item) => item.literature_id"
          >
            <template #renderItem="{ item }">
              <List.Item>
                <div v-if="false">
                  <!-- 调试信息 - 设置v-if="true"开启 -->
                  <pre>{{
                    JSON.stringify(
                      { id: item.literature_id, editable: item.editable },
                      null,
                      2,
                    )
                  }}</pre>
                </div>
                <LiteratureCard
                  :literature="item"
                  :selected="isLiteratureSelected(item.literature_id)"
                  :has-selected-literatures="hasSelectedLiteratures"
                  @update="handleLiteratureUpdate"
                  @select="toggleLiteratureSelection"
                  @view="handleLiteratureClick"
                />
              </List.Item>
            </template>
          </List>

          <!-- 列表视图 -->
          <LiteratureList
            v-else
            :literature-list="paginatedLiteratureList"
            :selected-ids="selectedLiteratureIds"
            :has-selected-literatures="hasSelectedLiteratures"
            :is-mobile="isMobile"
            @view="handleLiteratureClick"
            @delete="handleDelete"
            @edit="handleEditEndnoteInfo"
            @update-info="handleUpdatePdfInfo"
            @select="handleListSelectionChange"
          />

          <div v-if="literatureList.length === 0" class="empty-content">
            <p>当前文件夹暂无文献</p>
            <Button type="primary" @click="uploadModalVisible = true">
              上传文献
            </Button>
          </div>
          <div v-else class="pagination-container">
            <Pagination
              v-model:current="currentPage"
              :total="filteredLiteratureList.length"
              :page-size="pageSize"
              show-quick-jumper
              show-size-changer
              :page-size-options="['10', '20', '30', '40']"
              @change="handlePageChange"
              @show-size-change="handlePageSizeChange"
              :size="isMobile ? 'small' : 'default'"
            />
          </div>
        </Card>
      </div>
    </div>

    <!-- 上传文献弹窗 -->
    <UploadFile
      v-model:visible="uploadModalVisible"
      :folder-id="selectedFolderId"
      @success="handleUploadSuccess"
    />

    <!-- 创建/编辑文件夹弹窗 -->
    <!-- <FolderFormModal
      v-model:visible="folderFormVisible"
      :folder-data="editingFolder"
      :is-creating="isCreatingFolder"
      :parent-folder-id="folderFormParentId"
      @success="handleFolderFormSuccess"
    /> -->

    <!-- 创建智能文件夹弹窗 -->
    <!-- <SmartFolderFormModal
      v-model:visible="smartFolderFormVisible"
      :folder-data="editingFolder"
      @success="handleFolderFormSuccess"
    /> -->

    <!-- 移动文献弹窗 -->
    <!-- <MoveLiteratureModal
      v-model:visible="moveLiteratureModalVisible"
      :literature-ids="selectedLiteratureIds"
      :source-folder-id="selectedFolderId"
      @success="handleMoveLiteratureSuccess"
    /> -->

    <!-- 文献信息编辑器弹窗 -->
    <EndnoteInfoEditor
      v-if="showEndnoteEditor && currentEditingLiterature"
      :visible="showEndnoteEditor"
      :endnote-info="currentEditingLiterature.endnote_info"
      :title="`编辑《${currentEditingLiterature.endnote_info?.Title || currentEditingLiterature.title || ''}》的文献信息`"
      @cancel="showEndnoteEditor = false"
      @submit="handleEndnoteInfoSubmit"
    />
  </div>
</template>

<style lang="less" scoped>
.literature-page {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px); // 减去头部高度
  height: auto;
  overflow-x: hidden;
}

.literature-layout {
  display: flex;
  gap: 16px;
  height: 100%;
}

// 移动端样式
.mobile-layout {
  flex-direction: column;
}

.mobile-nav {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.mobile-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;

  .mobile-tab {
    flex: 1;
    padding: 12px;
    text-align: center;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      color: #1890ff;
      border-bottom: 2px solid #1890ff;
    }

    &:hover {
      background-color: #f9f9f9;
    }
  }
}

.mobile-hidden {
  display: none !important;
}

.folder-sidebar {
  width: 280px;
  background: #fff;
  border-radius: 2px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .folder-actions {
    display: flex;
    gap: 4px;
  }
}

.folder-search {
  margin-bottom: 12px;
}

.folder-tree-container {
  flex: 1;
  overflow: auto;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;

  .folder-icon {
    margin-right: 8px;
  }

  .folder-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder-count {
    margin: 0 8px;
    font-size: 12px;
    color: #999;
  }
}

.literature-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.ant-card-body) {
    padding: 16px;
    flex: 1;
    overflow: auto;
  }
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.folder-path {
  min-width: 200px;
}

.search-container {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.actions-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.view-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.selection-info {
  color: #1890ff;
  font-size: 14px;
}

.literature-title-cell {
  display: flex;
  align-items: center;
}

.empty-content {
  padding: 48px 0;
  text-align: center;

  p {
    margin-bottom: 16px;
    color: #666;
  }
}

.no-tags {
  color: #999;
  font-style: italic;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

// 移动端响应式样式调整
@media (max-width: 767px) {
  .literature-page {
    padding: 8px;
    overflow-y: auto;
    height: auto;
    min-height: 100vh;
  }

  .folder-sidebar {
    width: 100%;
    max-height: calc(100vh - 170px);
    overflow-y: auto;
  }

  .card-title {
    flex-direction: column;
    align-items: flex-start;

    .folder-path,
    .search-container,
    .actions-container {
      width: 100%;
      margin-bottom: 8px;
    }
  }

  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .view-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .literature-content {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .literature-layout.mobile-layout {
    height: auto;
    overflow: visible;
  }

  // 优化移动端弹窗
  :deep(.ant-modal) {
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }

  :deep(.ant-modal-content) {
    border-radius: 0;
  }
}
</style>
