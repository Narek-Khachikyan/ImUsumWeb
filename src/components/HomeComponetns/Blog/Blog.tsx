import styles from './blog.module.css';
import cn from 'classnames';

const Blog = () => {
   const title = document.querySelector('.title');
   if (title) {
      const text = title.innerHTML.split(' ');
      text[0] = '<span class="blue">' + text[0] + '</span>';
      title.innerHTML = text.join(' ');
   } else {
      console.log("Element with class 'title' not found");
   }

   return (
      <div className={cn(styles.blog)}>
         <div className={cn(styles.content)}></div>
      </div>
   );
};

export default Blog;
