import { Cache } from "../utils/cache";
import paginate, { generatePaginationCacheKey, PaginationParams, PaginationResult } from "../utils/pagination";

export class BaseService<T>{
    private cache=new Cache<T>();
   

     async create(doc:any,Model:any):Promise<T>{
        const newDoc= await Model.create(doc);

        this.cache.invalidateAll();

        return newDoc
    }

    async findAll(Model: any, cacheKey: string):Promise<T[]>{
        const data=this.cache.get(cacheKey)||await Model.find({});

        this.cache.set(cacheKey,data);

        return data
    }


    async findPaginated(query: PaginationParams):Promise<PaginationResult<T>>{
        const cacheKey=generatePaginationCacheKey(query)

        let data =this.cache.get(cacheKey)

        if(!data){
          data =  await paginate<T>(query)
        }

        this.cache.set(cacheKey,data);

        return data
    }

    protected async findById(id: string, Model: any, cacheKey?: string): Promise<T | null> {
        let cached = this.cache.get(cacheKey || id);
        
        if (!cached) {
          cached = await Model.findById(id)
          this.cache.set(cacheKey || id, cached);
        }

        return cached;
      }

      protected async findOne(query: object, Model: any, cacheKey: string): Promise<T | null> {
        let cached = this.cache.get(cacheKey);

        if (!cached) {
          cached = await Model.findOne(query)
          this.cache.set(cacheKey, cached);
        }

        return cached;
      }

      protected async update(
        id: string,
        data: any,
        Model: any,
      ): Promise<T | null> {
        const updatedDoc = await Model.findByIdAndUpdate(id, data, { new: true });

        if (updatedDoc) this.cache.invalidateAll()
        
        return updatedDoc;
      }


      protected async delete(id: string, Model: any): Promise<T | null> {
        const deletedDoc = await Model.findByIdAndDelete(id);

        if (deletedDoc) this.cache.invalidateAll()
        
        return deletedDoc;
      }
    }
