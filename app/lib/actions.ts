'use server';

import { z } from 'zod'; // Library for type validation
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache'; // clear the cache for a specific path
import { redirect } from 'next/navigation'; // redirect the user to a new page
import { signIn } from '@/auth';            // sign the user in
import { AuthError } from 'next-auth';      // authentication error


const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string(),
});


const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) { 
    // Async Function that accept user input form data and
    // create a new invoice in the database.

    // 1. Extract the form data
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    
    // Convert the amount to cents for storage
    const amountInCents = amount * 100;

    // create a new invoice date stamp
    const date = new Date().toISOString().split("T")[0];

    // 2. Create a new invoice in the database
    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;

    } catch (error) {
        return {
            error: " Database Error: Unable to create a new invoice."
        }
    }


    // 3. Clear the cache for the invoices page to trigger a new request to the server
    revalidatePath('/dashboard/invoices');

    // 4. Redirect the user to the invoices page
    redirect('/dashboard/invoices');
}


export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    // Async Function that accept user input form data and
    // update an existing invoice in the database.

    // 1. Extract the form data
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    // Convert the amount to cents for storage
    const amountInCents = amount * 100;

    // 2. Update the invoice in the database
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            error: " Database Error: Unable to update the invoice."
        }
    }
    
    // 3. Clear the cache for the invoices page to trigger a new request to the server
    revalidatePath('/dashboard/invoices');

    // 4. Redirect the user to the invoices page
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        // 1. Delete the invoice from the database
        sql`DELETE FROM invoices where id = ${id}`;

        // 2. Clear the cache for the invoices page to trigger a new request to the server
        revalidatePath('/dashboard/invoices');

    } catch (error) {
        return {
            error: " Database Error: Unable to delete the invoice."
        }
    }

}

// Function to Authenticate the user
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }