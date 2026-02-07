import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Title from '@/components/ui/Title';
import { blogService } from '@/services/blogService';
import type { BlogPost } from '@/types';
import { blog as fallbackBlogPosts } from '../../constants';
import blogImg1 from '@/assets/blogImg1.webp';
import BlogCard from './BlogCard';

const Blog = () => {
   const [posts, setPosts] = useState<BlogPost[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadPosts = async () => {
         try {
            const data = await blogService.getAll();
            if (Array.isArray(data) && data.length > 0) {
               setPosts(data);
            } else {
               setPosts(fallbackBlogPosts);
            }
         } catch {
            setPosts(fallbackBlogPosts);
         } finally {
            setIsLoading(false);
         }
      };

      void loadPosts();
   }, []);

   const displayedPosts = posts.slice(0, 3);

   return (
      <section className="py-section mb-section">
         <Title text="Դպրոցական նորություններ" />

         {isLoading ? (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
               {[...Array(3)].map((_, idx) => (
                  <div
                     key={idx}
                     className="h-[340px] animate-pulse rounded-2xl bg-neutral-100"
                  />
               ))}
            </div>
         ) : displayedPosts.length === 0 ? (
            <p className="mt-10 text-center text-neutral-500">Նորություններ դեռ հասանելի չեն</p>
         ) : (
            <motion.div
               className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
            >
               {displayedPosts.map((post, index) => (
                  <BlogCard
                     key={`${post.id}-${post.date}-${index}`}
                     image={post.image || blogImg1}
                     title={post.title}
                     letter={post.letter}
                     date={post.date}
                  />
               ))}
            </motion.div>
         )}
      </section>
   );
};

export default Blog;
