declare global {

  export interface UserInterface {
    id?: number;
    sessionId?: string;
    role: "user" | "admin";
    active: boolean;
    name: string;
    password: string;
    email: string;
  }

  export interface AnalysisReportInterface {
    id: number;
    file: string;
    hash: string;
    nsfw: string;
    faces: number;
    ages: string;
    children: number;
    classification: string;
    thumbnail?: string;
  }

  export interface AnalysisInterface {
    id?: number;
    userId?: number;
    name: string;
    path: string;
    image: boolean;
    video: boolean;
    porn_threshold: number;
    face_threshold: number;
    child_threshold: number;
    age_threshold: number;
    log: string;
    status: string;
    createdAt: Date
  }



  export interface UpdateResponse {
    updatedRows: number
  }

  export interface DeleteResponse {
    deletedRows: number
  }

}

export { };