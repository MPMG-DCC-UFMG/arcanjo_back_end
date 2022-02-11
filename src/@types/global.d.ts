declare global {

  export interface UserInterface {
    id?: number;
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
  }

  export interface AnalysisInterface {
    id?: number;
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
  }



  export interface UpdateResponse {
    updatedRows: number
  }

  export interface DeleteResponse {
    deletedRows: number
  }

}

export { };