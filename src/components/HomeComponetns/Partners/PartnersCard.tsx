import cn from 'classnames';
import styles from './partners.module.css';

interface PartnersCardProps {
   image: string;
}

const PartnersCard = ({ image }: PartnersCardProps) => {
   return (
      <div className={cn(styles.partners, 'w-[270] h-[112] rounded-2xl')}>
         <div
            className={cn(
               styles.content,
               'border border-blue-main flex justify-center items-center w-full h-full rounded-2xl py-4',
            )}>
            <img src={image} className={cn(styles.image, 'h-20 w-20')} alt="partners-imageCard" />
         </div>
      </div>
   );
};

export default PartnersCard;
