import styles from './blog.module.css';
import cn from 'classnames';

const Blog = () => {
   // TODO: Implement blog section with BlogCard components
   // Currently not rendering any content
   return (
      <div className={cn(styles.blog)}>
         <div className={cn(styles.content)}></div>
      </div>
   );
};

export default Blog;
