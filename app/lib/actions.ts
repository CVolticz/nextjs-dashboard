'use server';

import { z } from 'zod'; // Library for type validation
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache'; // clear the cache for a specific path
import { redirect } from 'next/navigation'; // redirect the user to a new page

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) { 
    // Async Function that accept user input form data and
    // create a new invoice in the database.

    // 1. Extract the form data
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // Convert the amount to cents for storage
    const amountInCents = amount * 100;

    // create a new invoice date stamp
    const date = new Date().toISOString().split("T")[0];

    // 2. Create a new invoice in the database
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    // 3. Clear the cache for the invoices page to trigger a new request to the server
    revalidatePath('/dashboard/invoices');

    // 4. Redirect the user to the invoices page
    redirect('/dashboard/invoices');
}


export async function updateInvoice(id: string, formData: FormData) {
    // Async Function that accept user input form data and
    // update an existing invoice in the database.

    // 1. Extract the form data
    const { customerId, amount, status } = UpdateInvoice.parse({
          customerId: formData.get('customerId'),
          amount: formData.get('amount'),
          status: formData.get('status'),
    });

    // Convert the amount to cents for storage
    const amountInCents = amount * 100;

    // 2. Update the invoice in the database
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;

    // 3. Clear the cache for the invoices page to trigger a new request to the server
    revalidatePath('/dashboard/invoices');

    // 4. Redirect the user to the invoices page
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // 1. Delete the invoice from the database
    sql`DELETE FROM invoices where id = ${id}`;

    // 2. Clear the cache for the invoices page to trigger a new request to the server
    revalidatePath('/dashboard/invoices');
}