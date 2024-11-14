import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Contact, ContactCreate, ContactFormMode } from '../../types/contacts';

interface ContactFormProps {
 open?: boolean;
 onClose: () => void;
 mode: ContactFormMode;
 contact?: Contact;
 onSubmit: (data: ContactCreate) => Promise<void>;
 isLoading?: boolean;
 isPageMode?: boolean;
}

interface FormData extends ContactCreate {
 first_name: string;
 last_name: string;
 phone: string;
 address: string;
 email?: string;
 notes?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
 open = true,
 onClose,
 mode,
 contact,
 onSubmit,
 isLoading = false,
 isPageMode = false
}) => {
 const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
   defaultValues: mode === ContactFormMode.EDIT && contact ? {
     first_name: contact.first_name,
     last_name: contact.last_name,
     phone: contact.phone,
     address: contact.address,
     email: contact.email,
     notes: contact.notes
   } : {
     first_name: '',
     last_name: '',
     phone: '',
     address: '',
     email: '',
     notes: ''
   }
 });

 const handleFormSubmit = async (data: FormData) => {
  console.log('Form submitted with data:', data);
  try {
    await onSubmit(data);
    console.log('Form submission successful');
    reset();
  } catch (error) {
    console.error('Form submission error:', error);
  }
};

 const handleCancel = () => {
  if (onClose) {
    onClose();
  }
};

 const formContent = (
   <form
     id="contact-form"
     onSubmit={handleSubmit(handleFormSubmit)}
     className="space-y-4"
   >
     <Input
       label="Nome"
       {...register('first_name', { required: 'Il nome è obbligatorio' })}
       error={errors.first_name?.message}
       disabled={isLoading}
       fullWidth
     />

     <Input
       label="Cognome"
       {...register('last_name', { required: 'Il cognome è obbligatorio' })}
       error={errors.last_name?.message}
       disabled={isLoading}
       fullWidth
     />

     <Input
       label="Telefono"
       {...register('phone', { required: 'Il telefono è obbligatorio' })}
       error={errors.phone?.message}
       disabled={isLoading}
       fullWidth
     />

     <Input
       label="Indirizzo"
       {...register('address', { required: 'L\'indirizzo è obbligatorio' })}
       error={errors.address?.message}
       disabled={isLoading}
       fullWidth
     />

     <Input
       label="Email"
       type="email"
       {...register('email', {
         pattern: {
           value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
           message: 'Email non valida'
         }
       })}
       error={errors.email?.message}
       disabled={isLoading}
       fullWidth
     />

     <Input
       label="Note"
       {...register('notes')}
       error={errors.notes?.message}
       disabled={isLoading}
       fullWidth
     />

     {isPageMode && (
       <div className="flex justify-end gap-2">
         <Button
           variant="secondary"
           onClick={onClose}
           disabled={isLoading}
         >
           Annulla
         </Button>
         <Button
           type="submit"
           isLoading={isLoading}
         >
           Salva
         </Button>
       </div>
     )}
   </form>
 );

 if (isPageMode) {
   return formContent;
 }

 return (
   <Modal
     open={open}
     onClose={onClose}
     title={mode === ContactFormMode.CREATE ? 'Nuovo Contatto' : 'Modifica Contatto'}
     preventClose={isLoading}
     size="md"
     footerContent={
       <div className="flex gap-2">
         <Button
           variant="secondary"
           onClick={handleCancel}
           disabled={isLoading}
         >
           Annulla
         </Button>
         <Button
           type="submit"
           form="contact-form"
           isLoading={isLoading}
         >
           Salva
         </Button>
       </div>
     }
   >
     {formContent}
   </Modal>
 );
};

export default ContactForm;