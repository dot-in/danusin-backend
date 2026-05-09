import { EntityType } from "@prisma/client";

export interface ImageUploadResponse {
  id: number;
  url: string;
  entity_type: EntityType;
  entity_id: number;
  is_primary: boolean;
  sort_order: number;
}

export interface BulkImageUploadDTO {
  entity_type: EntityType;
  entity_id: number;
  images: string[];
}
