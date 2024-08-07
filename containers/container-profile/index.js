import { useCallback, useState,useMemo } from 'react';
import { Box, Container } from '@chakra-ui/react';

import CreatePost from '@/components/post/createPost';
import SectionPosts from '@/components/post/sectionPosts';
import useQueries from '@/hooks/useQueries';

import ModalPost from '@/components/post/modalPost';
import CardProfile from '@/components/profile/cardProfile';

const ProfileContainer = ({ id }) => {
   const [formData, setFormData] = useState({ description: '' });
   const [modal, setModal] = useState({});

   const prefixUrl = useMemo(() => id ? `/posts/${id}` : '/posts?type=me',[id]);

   const { data, isLoading, fetchingData, useMutate, isLoadingSubmit, } = useQueries({
      prefixUrl,
      withToastSuccess: true
   });

   const {
      data: repliesById,
      isLoading: isLoadingReplies,
      fetchingData: fetchingReplies
   } = useQueries();

   const onChangeForm = useCallback((description) => {
      setFormData(s => ({ ...s, description }) )
   },[])

   const resetFormData = () => setFormData({ description: '' });

   const onShowModal = async (type, data) => {
      if(type === 'replies'){
         await fetchingReplies({ prefixUrl: `/replies/post/${data.id}` });
         setFormData(s => ({ ...s, id: data?.id }))
         setModal({ 
            isOpen: true, type,
            replies: repliesById, isLoadingReplies, 
            fetchingReplies: () => {
               fetchingReplies({ prefixUrl: `/replies/post/${data?.id}` });
               fetchingData({ prefixUrl });
            },
         });
      } else {
         setFormData(data);
         setModal({ isOpen: true, type });
      }
   }

   const onCreate = async () => {
      const response = await useMutate({ prefixUrl: "/post", payload: formData });
      if (response?.success) {
         resetFormData();
         fetchingData({ prefixUrl });
      }
   };
   
   const onSubmitForm = async () => {
      let { type } = modal;
      let method = { edit: 'PATCH', delete: 'DELETE', replies: 'POST' };
      let prefix = { edit: `/post/update/`,delete: '/post/delete/', replies: '/replies/post/' };
      
      const response = await useMutate({
         prefixUrl: prefix[type]+formData?.id,
         method: method[type],
         payload: { description: formData?.description },
      });

      if (response?.success) {
         if(type === 'replies'){
            fetchingReplies({ prefixUrl: `/replies/post/${formData?.id}` });
            setFormData(s => ({ ...s, description: '' }));
            fetchingData({ prefixUrl });
         } else {
            setModal({});
            resetFormData();
            fetchingData({ prefixUrl });
         }
      }
   }

   const onLike = async (d) => {
      let type = d.is_like_post ? "/unlikes" : "/likes";
      const response = await useMutate({ prefixUrl: `${type}/post/${d?.id}` });
      if (response?.success) {
         fetchingData({ prefixUrl });
      }
   }

   return (
      <Container padding='0'>
         <ModalPost 
            modal={modal} 
            setModal={setModal}
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmitForm}
            replies={repliesById}
            isLoadingReplies={isLoadingReplies}
         />
         <Box position='sticky' top='0' zIndex='2' mb='3'>
            <CardProfile id={id} />
            {!id && <CreatePost
               value={formData?.description}
               isLoading={isLoadingSubmit}
               onChange={onChangeForm}
               onCreate={onCreate}
            />}
         </Box>

         <SectionPosts
            data={data?.slice(0, 50)}
            onEdit={(d) => onShowModal('edit', d)}
            onDelete={(d) => onShowModal('delete', d)}
            onLike={d => onLike(d)}
            onReplies={(d) => onShowModal('replies', d)}
            isLoading={isLoading}
         />


      </Container>
   )
}

export default ProfileContainer;