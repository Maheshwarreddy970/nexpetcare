'use server';

import { prisma } from '@/lib/store/prisma';

export async function getCustomerPetsAction(customerId: string) {
  try {
    const pets = await prisma.pet?.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPets = (pets || []).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      breed: p.breed || undefined,
      age: p.age || undefined,
      gender: p.gender || undefined,
    }));

    return { success: true, pets: formattedPets };
  } catch (error) {
    console.error('Error fetching pets:', error);
    return { success: false, error: 'Failed to fetch pets', pets: [] };
  }
}

export async function createPetAction(data: {
  customerId: string;
  tenantId: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  gender?: string;
}) {
  try {
    const pet = await prisma.pet?.create({
      data: {
        customerId: data.customerId,
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
        breed: data.breed,
        age: data.age,
        gender: data.gender,
      },
    });

    if (!pet) {
      return { success: false, error: 'Failed to add pet' };
    }

    return {
      success: true,
      pet: {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed || undefined,
        age: pet.age || undefined,
        gender: pet.gender || undefined,
      },
      message: 'Pet added successfully!',
    };
  } catch (error) {
    console.error('Error creating pet:', error);
    return { success: false, error: 'Failed to add pet' };
  }
}

export async function updatePetAction(petId: string, data: any) {
  try {
    const pet = await prisma.pet?.update({
      where: { id: petId },
      data,
    });

    return { success: true, pet, message: 'Pet updated successfully!' };
  } catch (error) {
    console.error('Error updating pet:', error);
    return { success: false, error: 'Failed to update pet' };
  }
}
