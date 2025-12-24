import styles from './blog.module.css';
import cn from 'classnames';

interface BlogCardProps {
   image: string;
   title: string;
   letter: string;
   date: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BlogCard = (_props: BlogCardProps) => {
   // TODO: Implement proper blog card rendering
   // Currently props are defined but not rendered
   return (
      <div className={cn(styles.blogCard)}>
         <div className={cn(styles.blogCard__content)}></div>
      </div>
   );
};

export default BlogCard;
