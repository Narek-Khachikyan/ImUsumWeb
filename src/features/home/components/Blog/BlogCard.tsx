interface BlogCardProps {
   image: string;
   title: string;
   letter: string;
   date: string;
}

const BlogCard = ({ image, title, letter, date }: BlogCardProps) => {
   const formattedDate = new Date(date).toLocaleDateString('hy-AM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
   });

   return (
      <article className="group overflow-hidden rounded-2xl bg-white shadow-soft transition-shadow duration-300 hover:shadow-card">
         <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
            <img
               src={image}
               alt={title}
               className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
               loading="lazy"
            />
         </div>

         <div className="space-y-3 p-5">
            <p className="text-sm text-neutral-500">{formattedDate}</p>
            <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900">{title}</h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{letter}</p>
         </div>
      </article>
   );
};

export default BlogCard;
