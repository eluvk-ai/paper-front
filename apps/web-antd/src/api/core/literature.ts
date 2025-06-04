import { requestClient } from '#/api/request';

export interface EndnoteInfo {
  Tags?: string;
  ReferenceType?: string;
  Author?: string[];
  Year?: string;
  Title?: string;
  Journal?: string;
  Volume?: string;
  Part_Supplement?: string;
  Issue?: string;
  Pages?: string;
  StartPage?: string;
  Errata?: string;
  EpubDate?: string;
  Date?: string;
  TypeOfArticle?: string;
  ShortTitle?: string;
  AlternateJournal?: string;
  ISSN?: string;
  DOI?: string;
  OriginalPublication?: string;
  ReprintEdition?: string;
  ReviewedItem?: string;
  LegalNote?: string;
  PMCID?: string;
  NIHMSID?: string;
  ArticleNumber?: string;
  AccessionNumber?: string;
  CallNumber?: string;
  Label?: string;
  Keywords?: string[];
  Abstract?: string;
  Notes?: string;
  ResearchNotes?: string;
  URL?: string;
  FileAttachments?: string;
  AuthorAddress?: any;
  Figure?: string;
  Caption?: string;
  AccessDate?: string;
  TranslatedAuthor?: string;
  TranslatedTitle?: string;
  NameOfDatabase?: string;
  DatabaseProvider?: string;
  Language?: string;
  AcademicDepartment?: string;
  PlacePublished?: string;
  University?: string;
  Degree?: string;
  DocumentNumber?: string;
  NumberOfPages?: string;
  Advisor?: string;
  ThesisType?: string;
}

export interface LiteratureModel {
  literature_id: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  upload_time: string;
  uploader_id: string;
  uploader_name?: string;
  description?: string;
  author?: string[];
  keywords?: string[];
  abstract?: string;
  tags?: string[];
  visible_to?: string[];
  editable_by?: string[];
  topics?: string[];
  endnote_info?: EndnoteInfo;
  visible: boolean;
  editable: boolean;
}

export interface ReadingTimeParams {
  literatureId: string;
  seconds: number;
  timestamp: string;
}

export interface UploadLiteratureParams {
  file: File;
  title?: string;
  description?: string;
  tags?: string;
  topic_id?: string;
  folder_id?: string;
}

export function uploadLiteratureApi(params: UploadLiteratureParams) {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.title) formData.append('title', params.title);
  if (params.description) formData.append('description', params.description);
  if (params.tags) formData.append('tags', params.tags);
  if (params.topic_id) formData.append('topic_id', params.topic_id);
  if (params.folder_id) formData.append('folder_id', params.folder_id);

  return requestClient.post<LiteratureModel>('/literature/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function getLiteratureListApi(params?: {
  limit?: number;
  skip?: number;
}) {
  return requestClient.get<LiteratureModel[]>('/literature/list', { params });
}

export function getLiteratureDetailApi(id: string) {
  return requestClient.get<LiteratureModel>(`/literature/detail/${id}`);
}

// 获取当前对话的聊天记录
export function getConversationChatRecordApi(conversationId: string) {
  return requestClient.get<{ data: any[] }>(
    `/literature/get_current_chat/${conversationId}`,
  );
}

export function deleteLiteratureApi(id: string) {
  return requestClient.delete<{ message: string }>(
    `/literature/uploader/${id}`,
  );
}

export function deleteLiteratureByTopicIdApi(
  literatureId: string,
  topicId: string,
) {
  return requestClient.delete<{ message: string }>(
    `/literature/topic/${literatureId}/${topicId}`,
  );
}

/**
 * 获取PDF文件的临时URL
 */
export function getPdfTempUrlApi(literatureId: string) {
  return requestClient.get<{ data: string }>(
    `/literature/pdf_temp_url/${literatureId}`,
  );
}

/**
 * 获取会话ID
 */
export function getSessionIdApi(literatureId: string) {
  return requestClient.post<{ session_id: string }>(
    `/literature/get_session_id`,
    { literature_id: literatureId },
  );
}

/**
 * 获取当前的会话信息（包含历史聊天记录）
 */
export function getCurrentConversationApi(literatureId: string) {
  return requestClient.get(
    `/literature/get_current_conversation/${literatureId}`,
  );
}

/**
 * 新建一个对话，会将当前会话置为不活跃，并创建新会话
 */
export function getNewConversationApi(literatureId: string) {
  return requestClient.post(`/literature/get_new_conversation/${literatureId}`);
}

export interface ChatRequest {
  message_content: string;
  conversation_id: string;
  model_name: string;
}

/**
 * 调用 /chat 接口，获取机器人回复
 */
export function chatApi(conversationId: string, payload: ChatRequest) {
  return requestClient.post(`/literature/chat/${conversationId}`, payload);
}

/**
 * 获取课题的文献列表
 */
export function getLiteratureListByTopicIdApi(topicId: string) {
  return requestClient.get<LiteratureModel[]>(
    `/literature/get_literature_list_by_topic_id/${topicId}`,
  );
}

interface ReadingTimeRecord {
  literatureId: string;
  seconds: number;
  timestamp: string;
}

// 保存阅读时间
export function saveReadingTime(data: ReadingTimeRecord) {
  return requestClient.post(
    `/literature/${data.literatureId}/reading_time`,
    data,
  );
}

// 获取阅读时间统计
export function getReadingTime(
  literatureId: string,
  startTime?: string,
  endTime?: string,
) {
  const params = new URLSearchParams();
  if (startTime) params.append('start_time', startTime);
  if (endTime) params.append('end_time', endTime);

  return requestClient.get(
    `/literature/${literatureId}/reading_time?${params.toString()}`,
  );
}

export function getLatestLiteratureApi() {
  return requestClient.get<LiteratureModel[]>('/literature/latest');
}

export interface UpdatePdfInfoParams {
  literature_id: string;
  model_name?: string;
}

/**
 * 更新PDF信息
 */
export function updatePdfInfoApi(literatureId: string, modelName?: string) {
  return requestClient.post('/literature/update_pdf_info', {
    literature_id: literatureId,
    model_name: modelName,
  });
}

/**
 * 手动更新文献的EndnoteInfo
 */
export function updateEndnoteInfoApi(
  literatureId: string,
  endnoteInfo: EndnoteInfo,
) {
  return requestClient.post('/literature/update_endnote_info', {
    literature_id: literatureId,
    endnote_info: endnoteInfo,
  });
}

/**
 * 获取文献数量
 */
export async function getLiteratureCountApi() {
  return requestClient.get<{ literature_count: number }>('/literature/count');
}

/**
 * 更新文献标签
 */
export function updateLiteratureTags(literatureId: string, tags: string[]) {
  return requestClient.post('/literature/update_tags', {
    literature_id: literatureId,
    tags,
  });
}

/**
 * 获取常用标签
 */
export interface TagWithColor {
  name: string;
  color: {
    bg: string; // 背景色
    color: string; // 文字颜色
  };
}

export interface CommonTagsResponse {
  tags: string[];
  tags_with_colors: TagWithColor[];
}

export function getCommonTagsApi() {
  return requestClient.get<CommonTagsResponse>('/literature/common_tags');
}

/**
 * 根据real_resource_id获取文献的endnote信息
 */
export interface GetEndnoteInfoByRealIdParams {
  real_resource_id: string;
  real_resource_type?: string;
}

export function getEndnoteInfoByRealIdApi(
  params: GetEndnoteInfoByRealIdParams,
) {
  return requestClient.post<{ endnote_info: EndnoteInfo }>(
    '/paper/get_endnote_info_by_real_id',
    params,
  );
}

/**
 * 批量获取文献的endnote信息
 */
export interface BatchGetEndnoteInfoParams {
  real_resource_ids: string[];
  real_resource_type?: string;
}

export function batchGetEndnoteInfoApi(params: BatchGetEndnoteInfoParams) {
  return requestClient.post<{ data: Record<string, EndnoteInfo> }>(
    '/paper/batch_get_endnote_info',
    params,
  );
}
