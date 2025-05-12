import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { 
    fetchSpecificationAttributes, 
    fetchSpecificationAttributeById,
    createSpecificationAttribute as createAttributeApi, 
    updateSpecificationAttribute as updateAttributeApi,
    deleteSpecificationAttribute as deleteAttributeApi,
    getProductSpecifications,
    setProductSpecification,
    removeProductSpecification
} from '$lib/api/specificationsApi';
import type { SpecificationAttribute } from '$lib/types/supabaseTypes';

// Create the attribute stores
export const attributes = writable<SpecificationAttribute[]>([]);
export const isAttributesLoading = writable<boolean>(false);
export const attributesError = writable<string | null>(null);
export const selectedAttribute = writable<SpecificationAttribute | null>(null);

let cachedAttributes: SpecificationAttribute[] = [];

if (browser) {
    const savedAttributes = localStorage.getItem('specificationAttributes');
    if (savedAttributes) {
        try {
            const parsedAttributes = JSON.parse(savedAttributes);
            attributes.set(parsedAttributes);
            cachedAttributes = parsedAttributes;
        } catch (e) {
            console.error('Failed to parse saved attributes:', e);
        }
    }

    attributes.subscribe(items => {
        if (items.length > 0) {
            localStorage.setItem('specificationAttributes', JSON.stringify(items));
            cachedAttributes = items;
        }
    });
}

/**
 * Loads all specification attributes from the database and updates the store
 * @param forceRefresh If true, forces a refresh from database regardless of cache
 * @returns Promise with the loaded attributes
 */
export async function loadAllAttributes(forceRefresh: boolean = false): Promise<SpecificationAttribute[]> {
    if (!forceRefresh && cachedAttributes.length > 0) {
        attributes.set(cachedAttributes);
        return cachedAttributes;
    }

    isAttributesLoading.set(true);
    attributesError.set(null);
    
    try {
        const items = await fetchSpecificationAttributes();
        attributes.set(items);
        cachedAttributes = items;
        return items;
    } catch (error) {
        console.error('Error fetching specification attributes:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to load specification attributes');
        }
        return [];
    } finally {
        isAttributesLoading.set(false);
    }
}

/**
 * Gets a single attribute by ID
 * First checks the cache, then fetches from database if needed
 * @param attributeId The ID of the attribute to get
 * @param forceRefresh If true, forces a refresh from database
 * @returns Promise with the attribute or null if not found
 */
export async function getAttributeById(
    attributeId: number, 
    forceRefresh: boolean = false
): Promise<SpecificationAttribute | null> {
    if (!forceRefresh) {
        const cachedAttribute = cachedAttributes.find(attr => attr.id === attributeId);
        if (cachedAttribute) {
            selectedAttribute.set(cachedAttribute);
            return cachedAttribute;
        }

        const storeAttributes = get(attributes);
        const storeAttribute = storeAttributes.find(attr => attr.id === attributeId);
        if (storeAttribute) {
            selectedAttribute.set(storeAttribute);
            return storeAttribute;
        }
    }

    isAttributesLoading.set(true);
    attributesError.set(null);
    
    try {
        const attr = await fetchSpecificationAttributeById(attributeId);
        if (attr) {
            selectedAttribute.set(attr);
            
            const index = cachedAttributes.findIndex(a => a.id === attributeId);
            if (index > -1) {
                cachedAttributes[index] = attr;
                attributes.set([...cachedAttributes]);
            } else {
                cachedAttributes = [...cachedAttributes, attr];
                attributes.set(cachedAttributes);
            }
        }
        return attr;
    } catch (error) {
        console.error(`Error fetching attribute with ID ${attributeId}:`, error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set(`Failed to load attribute with ID ${attributeId}`);
        }
        return null;
    } finally {
        isAttributesLoading.set(false);
    }
}

/**
 * Gets an attribute by slug
 * @param slug The slug of the attribute
 * @returns Attribute if found, or null if not
 */
export function getAttributeBySlug(slug: string): SpecificationAttribute | null {
    const normalizedSlug = slug.toLowerCase();
    
    const cachedAttribute = cachedAttributes.find(
        attr => attr.slug && attr.slug.toLowerCase() === normalizedSlug
    );
    if (cachedAttribute) {
        selectedAttribute.set(cachedAttribute);
        return cachedAttribute;
    }

    const storeAttributes = get(attributes);
    const storeAttribute = storeAttributes.find(
        attr => attr.slug && attr.slug.toLowerCase() === normalizedSlug
    );
    if (storeAttribute) {
        selectedAttribute.set(storeAttribute);
        return storeAttribute;
    }

    return null;
}

/**
 * Gets an attribute by name
 * @param name The name of the attribute
 * @returns Attribute if found, or null if not
 */
export function getAttributeByName(name: string): SpecificationAttribute | null {
    const normalizedName = name.toLowerCase();
    
    const cachedAttribute = cachedAttributes.find(
        attr => attr.name.toLowerCase() === normalizedName
    );
    if (cachedAttribute) {
        selectedAttribute.set(cachedAttribute);
        return cachedAttribute;
    }

    const storeAttributes = get(attributes);
    const storeAttribute = storeAttributes.find(
        attr => attr.name.toLowerCase() === normalizedName
    );
    if (storeAttribute) {
        selectedAttribute.set(storeAttribute);
        return storeAttribute;
    }

    return null;
}

/**
 * Creates a new specification attribute
 * @param attributeData The attribute data to create
 * @returns Promise with the created attribute
 */
export async function createAttribute(attributeData: Partial<SpecificationAttribute>): Promise<SpecificationAttribute> {
    try {
        attributesError.set(null);
        const result = await createAttributeApi(attributeData);
        
        cachedAttributes = [...cachedAttributes, result];
        attributes.set(cachedAttributes);
        
        return result;
    } catch (error) {
        console.error('Error creating attribute:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to create attribute');
        }
        throw error;
    }
}

/**
 * Updates an existing specification attribute
 * @param id The ID of the attribute to update
 * @param attributeData The updated attribute data
 * @returns Promise with the updated attribute
 */
export async function updateAttribute(
    id: number, 
    attributeData: Partial<SpecificationAttribute>
): Promise<SpecificationAttribute> {
    try {
        attributesError.set(null);
        const result = await updateAttributeApi(id, attributeData);
        
        const index = cachedAttributes.findIndex(attr => attr.id === id);
        if (index > -1) {
            cachedAttributes[index] = result;
            attributes.set([...cachedAttributes]);
        }
        
        return result;
    } catch (error) {
        console.error('Error updating attribute:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to update attribute');
        }
        throw error;
    }
}

/**
 * Deletes a specification attribute
 * @param attributeId The ID of the attribute to delete
 * @returns Promise with success status
 */
export async function deleteAttribute(attributeId: number): Promise<{ success: boolean }> {
    try {
        attributesError.set(null);
        const result = await deleteAttributeApi(attributeId);
        
        if (result.success) {
            cachedAttributes = cachedAttributes.filter(attr => attr.id !== attributeId);
            attributes.set(cachedAttributes);
            
            const selected = get(selectedAttribute);
            if (selected && selected.id === attributeId) {
                selectedAttribute.set(null);
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting attribute:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to delete attribute');
        }
        throw error;
    }
}

/**
 * Gets all specifications for a product
 * @param productId The ID of the product
 * @returns Promise with product specifications and their attributes
 */
export async function getProductSpecificationsWithAttributes(productId: number): Promise<Array<{
    attribute: SpecificationAttribute;
    value: string;
}>> {
    try {
        attributesError.set(null);
        const specifications = await getProductSpecifications(productId);
        return specifications;
    } catch (error) {
        console.error(`Error getting specifications for product ${productId}:`, error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set(`Failed to get specifications for product ${productId}`);
        }
        throw error;
    }
}

/**
 * Sets a specification value for a product
 * @param productId The ID of the product
 * @param attributeId The ID of the specification attribute
 * @param value The value to set
 * @returns Promise with success status
 */
export async function setProductSpecificationValue(
    productId: number,
    attributeId: number,
    value: string
): Promise<{ success: boolean }> {
    try {
        attributesError.set(null);
        return await setProductSpecification(productId, attributeId, value);
    } catch (error) {
        console.error('Error setting product specification:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to set product specification');
        }
        throw error;
    }
}

/**
 * Removes a specification from a product
 * @param productId The ID of the product
 * @param attributeId The ID of the specification attribute
 * @returns Promise with success status
 */
export async function removeProductSpecificationValue(
    productId: number,
    attributeId: number
): Promise<{ success: boolean }> {
    try {
        attributesError.set(null);
        return await removeProductSpecification(productId, attributeId);
    } catch (error) {
        console.error('Error removing product specification:', error);
        if (error instanceof Error) {
            attributesError.set(error.message);
        } else {
            attributesError.set('Failed to remove product specification');
        }
        throw error;
    }
}

/**
 * Clears the attribute cache and resets the store
 */
export function clearAttributeCache(): void {
    attributes.set([]);
    selectedAttribute.set(null);
    cachedAttributes = [];
    
    if (browser) {
        localStorage.removeItem('specificationAttributes');
    }
}
