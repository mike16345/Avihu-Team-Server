import { ISession } from "../models/sessionModel";

export const removeExpiredMeals=(session:ISession)=>{
    const now = new Date();
  
    // Create normalized date range
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
  
    const result = {};
  
    for (const key of Object.keys(session.data)) {
      const keyDate = new Date(key); // relies on YYYY-MM-DD format
  
      if (keyDate >= twoDaysAgo && keyDate <= today) {
        result[key] = session.data[key];
      }
    }
  
   
    return result;
}

