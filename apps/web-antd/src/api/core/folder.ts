import { requestClient } from '#/api/request';

export namespace FolderApi {
  export enum FolderType {
    SYSTEM = 'system',
    USER = 'user',
  }

  export interface Folder {
    id: string;
    parentId?: string;

    name: string;
    description?: string;
    type: FolderType;
  }

  export interface CreateFolderParams {
    name: string; // create must have a name
    parentId?: string;
    description?: string;
    icon?: string;
    color?: string;
    isPinned?: boolean;
    sortOrder?: number;
  }

  export interface UpdateFolderParams {
    name?: string;
    parentId?: string;
    description?: string;
    icon?: string;
    color?: string;
    isPinned?: boolean;
    sortOrder?: number;
  }
}

export async function listFoldersApi() {
  return requestClient.get<FolderApi.Folder[]>('/folder');
}

export async function createFolderApi(data: FolderApi.CreateFolderParams) {
  return requestClient.post<FolderApi.FolderModel>('/folder', data);
}

export async function updateFolderApi(
  folderId: string,
  data: FolderApi.UpdateFolderParams,
) {
  return requestClient.put<FolderApi.FolderModel>(`/folder/${folderId}`, data);
}

// -----
export namespace FolderApi {
  // 智能文件夹规则接口
  export interface SmartFolderRule {
    field: string;
    operator: string;
    value: any;
    logic?: 'AND' | 'OR';
  }

  // 文件夹统计信息
  export interface FolderStatistics {
    literature_count: number;
    total_reading_time: number;
    last_updated: string;
  }

  // 文件夹模型
  export interface FolderModel {
    folder_id: string;
    name: string;
    parent_folder_id?: string;
    creator_id: string;
    description?: string;
    icon?: string;
    color?: string;
    folder_type: string;
    is_default: boolean;
    is_pinned: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    visible_to: string[];
    editable_by: string[];
    smart_rules?: SmartFolderRule[];
  }

  // 文件夹树节点
  export interface FolderTreeNode {
    id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
    is_default: boolean;
    is_pinned: boolean;
    description?: string;
    creator_id: string;
    created_at: string;
    updated_at: string;
    visible_to: string[];
    editable_by: string[];
    parent_id?: string;
    statistics: {
      literature_count: number;
      total_reading_time: number;
    };
    children: FolderTreeNode[];
  }

  // 文件夹详情响应
  export interface FolderDetailResponse {
    folder: FolderModel;
    statistics: FolderStatistics;
    children: FolderModel[];
    path: FolderModel[];
  }

  // 创建文件夹请求参数
  // export interface CreateFolderParams {
  //   name: string;
  //   parent_folder_id?: string;
  //   description?: string;
  //   icon?: string;
  //   color?: string;
  //   is_pinned?: boolean;
  //   sort_order?: number;
  // }

  // 创建智能文件夹请求参数
  export interface CreateSmartFolderParams {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    rules: SmartFolderRule[];
    is_pinned?: boolean;
    sort_order?: number;
  }

  // 更新文件夹请求参数
  // export interface UpdateFolderParams {
  //   name?: string;
  //   parent_folder_id?: string;
  //   description?: string;
  //   icon?: string;
  //   color?: string;
  //   is_pinned?: boolean;
  //   sort_order?: number;
  // }

  // 文献与文件夹关联请求参数
  export interface LiteraturesToFolderParams {
    literature_ids: string[];
    folder_id: string;
  }

  // 移动文献请求参数
  export interface MoveLiteratureParams {
    literature_id: string;
    source_folder_id: string;
    target_folder_id: string;
  }

  // 更新文件夹权限请求参数
  export interface FolderPermissionParams {
    visible_to?: string[];
    editable_by?: string[];
  }

  // 批量操作响应
  export interface BatchOperationResult {
    success_count: number;
    failed_count: number;
    results: Record<string, boolean>;
  }
}

/**
 * 获取文件夹树结构
 */
export async function getFolderTreeApi() {
  return requestClient.get<FolderApi.FolderTreeNode[]>('/folder/list');
}

/**
 * 获取文件夹详情
 * @param folderId 文件夹ID
 */
export async function getFolderDetailApi(folderId: string) {
  return requestClient.get<FolderApi.FolderDetailResponse>(
    `/folder/${folderId}`,
  );
}

/**
 * 创建普通文件夹
 * @param data 文件夹数据
 */
// export async function createFolderApi(data: FolderApi.CreateFolderParams) {
//   return requestClient.post<FolderApi.FolderModel>('/folder/create', data);
// }

/**
 * 创建智能文件夹
 * @param data 智能文件夹数据
 */
export async function createSmartFolderApi(
  data: FolderApi.CreateSmartFolderParams,
) {
  return requestClient.post<FolderApi.FolderModel>(
    '/folder/smart/create',
    data,
  );
}

/**
 * 更新文件夹
 * @param folderId 文件夹ID
 * @param data 更新数据
 */
// export async function updateFolderApi(
//   folderId: string,
//   data: FolderApi.UpdateFolderParams,
// ) {
//   return requestClient.put<FolderApi.FolderModel>(`/folder/${folderId}`, data);
// }

/**
 * 删除文件夹
 * @param folderId 文件夹ID
 * @param recursive 是否递归删除子文件夹和内容
 */
export async function deleteFolderApi(
  folderId: string,
  recursive: boolean = false,
) {
  return requestClient.delete(`/folder/${folderId}`, {
    params: { recursive },
  });
}

/**
 * 获取文件夹中的文献
 * @param folderId 文件夹ID
 * @param skip 跳过的条数
 * @param limit 获取的条数
 */
export async function getFolderLiteraturesApi(
  folderId: string,
  skip: number = 0,
  limit: number = 100,
) {
  return requestClient.get(`/folder/${folderId}/literatures`, {
    params: { skip, limit },
  });
}

/**
 * 添加文献到文件夹
 * @param data 文献与文件夹关联数据
 */
export async function addLiteraturesToFolderApi(
  data: FolderApi.LiteraturesToFolderParams,
) {
  return requestClient.post<FolderApi.BatchOperationResult>(
    '/folder/add-literatures',
    data,
  );
}

/**
 * 从文件夹中移除文献
 * @param data 文献与文件夹关联数据
 */
export async function removeLiteraturesFromFolderApi(
  data: FolderApi.LiteraturesToFolderParams,
) {
  return requestClient.post<FolderApi.BatchOperationResult>(
    '/folder/remove-literatures',
    data,
  );
}

/**
 * 将文献从一个文件夹移动到另一个文件夹
 * @param data 移动文献数据
 */
export async function moveLiteratureBetweenFoldersApi(
  data: FolderApi.MoveLiteratureParams,
) {
  return requestClient.post('/folder/move-literature', data);
}

/**
 * 获取包含指定文献的所有文件夹
 * @param literatureId 文献ID
 */
export async function getFoldersContainingLiteratureApi(literatureId: string) {
  return requestClient.get<FolderApi.FolderModel[]>(
    `/folder/containing/${literatureId}`,
  );
}

/**
 * 更新文件夹权限
 * @param folderId 文件夹ID
 * @param data 权限数据
 */
export async function updateFolderPermissionsApi(
  folderId: string,
  data: FolderApi.FolderPermissionParams,
) {
  return requestClient.post<FolderApi.FolderModel>(
    `/folder/${folderId}/permissions`,
    data,
  );
}

/**
 * 初始化默认文件夹
 */
export async function initializeDefaultFoldersApi() {
  return requestClient.post('/folder/initialize');
}

/**
 * 检查并初始化文件夹结构
 * 用于应用启动时确保用户有默认文件夹
 */
// todo we don't need this api, make sure folder structure is initialized in the backend
export async function ensureUserFoldersInitializedApi() {
  try {
    const folders = await getFolderTreeApi();

    // 检查是否存在任何默认文件夹
    const hasDefaultFolders = folders.some((folder) => folder.is_default);

    if (!hasDefaultFolders) {
      await initializeDefaultFoldersApi();
      return true; // 表示执行了初始化
    }

    return false; // 表示无需初始化
  } catch (error) {
    console.error('检查文件夹初始化状态失败:', error);
    return false;
  }
}

/**
 * 刷新所有文件夹的统计信息
 * 用于修复文件夹中文献数量显示不正确的问题
 */
export async function refreshFolderStatisticsApi() {
  return requestClient.post('/folder/refresh-statistics');
}

/**
 * 获取文件夹图标映射
 * 返回预设的文件夹图标选项，用于UI选择
 */
export function getFolderIconOptions() {
  return [
    { value: 'folder', label: '普通文件夹' },
    { value: 'book', label: '书籍' },
    { value: 'experiment', label: '实验' },
    { value: 'star', label: '收藏' },
    { value: 'project', label: '项目' },
    { value: 'team', label: '团队' },
    { value: 'bulb', label: '想法' },
    { value: 'clock-circle', label: '时间' },
    { value: 'question-circle', label: '问题' },
    { value: 'file-text', label: '文档' },
  ];
}

/**
 * 获取文件夹颜色映射
 * 返回预设的文件夹颜色选项，用于UI选择
 */
export function getFolderColorOptions() {
  return [
    { value: '#1890ff', label: '蓝色' },
    { value: '#52c41a', label: '绿色' },
    { value: '#faad14', label: '黄色' },
    { value: '#f5222d', label: '红色' },
    { value: '#722ed1', label: '紫色' },
    { value: '#13c2c2', label: '青色' },
    { value: '#eb2f96', label: '粉色' },
    { value: '#fa8c16', label: '橙色' },
    { value: '#a0d911', label: '浅绿色' },
    { value: '#1d39c4', label: '深蓝色' },
  ];
}

/**
 * 获取文献字段选项
 * 用于创建智能文件夹规则时选择字段
 */
export function getLiteratureFieldOptions() {
  return [
    { value: 'title', label: '标题' },
    { value: 'author', label: '作者' },
    { value: 'keywords', label: '关键词' },
    { value: 'abstract', label: '摘要' },
    { value: 'tags', label: '标签' },
    { value: 'upload_time', label: '上传时间' },
    { value: 'file_name', label: '文件名' },
  ];
}

/**
 * 获取操作符选项
 * 用于创建智能文件夹规则时选择操作符
 */
export function getOperatorOptions() {
  return [
    { value: 'equals', label: '等于' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '以...开始' },
    { value: 'endsWith', label: '以...结束' },
    { value: 'greaterThan', label: '大于' },
    { value: 'lessThan', label: '小于' },
  ];
}
