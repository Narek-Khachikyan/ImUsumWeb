import styles from './blog.module.css';
import cn from 'classnames';

interface BlogCardProps {
   image: string;
   title: string;
   letter: string;
   date: string;
}

const BlogCard = ({ image, title, letter, date }: BlogCardProps) => {
   const titleBlue = document.querySelector('.title');
   if (titleBlue) {
      const text = title.innerHTML.split(' ');
      text[0] = '<span class="blue">' + text[0] + '</span>';
      titleBlue.innerHTML = text.join(' ');
   } else {
      console.log("Element with class 'title' not found");
   }
   return (
      <div className={cn(styles.blogCard)}>
         <div className={cn(styles.blogCard__content)}></div>
      </div>
   );
};

export default BlogCard;
