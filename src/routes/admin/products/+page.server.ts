import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    
    if (!user) {
        console.log('User not authenticated. Redirecting to login page.');
        throw redirect(302, '/');
    }

    return {
        user
    };
};
