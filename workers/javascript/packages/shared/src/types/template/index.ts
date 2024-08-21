export enum TemplateStatus {
  PENDING = 'Pending',
  LIMITED = 'Limited',
  LISTED = 'Listed',
  UNLISTED = 'Unlisted'
}

export interface TemplateResponseDto {
  id: string;
  name: string;
  description: string;
  coverImgUrl: string;
  status: string;
}

export interface TemplateInstanceResponseDto {
  id: string;
  name: string;
  applicationId: string;
  pluginId: string;
  templateId?: string;
  templateName?: string;
  templateDescription?: string;
  templateCoverImgUrl?: string;
}
