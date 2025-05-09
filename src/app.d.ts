// for information about these interfaces
declare global {
	
		namespace App {
			
				interface Locals {
					user?: import('@supabase/supabase-js').User;
					isAdmin?: boolean;
					userEmail?: string;  // Debug property
					userId?: string;     // Debug property
				}
			
		}
	
}

export {};
