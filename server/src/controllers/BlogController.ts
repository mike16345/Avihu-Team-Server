import { BlogService } from "../services/BlogService";
import { IBlog } from "../interfaces/IBlog";
import BaseController from "./BaseController";

export class BlogController extends BaseController<IBlog,BlogService>{
  constructor(){
    super(new BlogService());
  }








}
