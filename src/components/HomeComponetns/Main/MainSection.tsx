import generalImg from '../../../assets/homeImg1.svg';

const MainSection = () => {
   return (
      <section className={'mb-24'}>
         <div className={'flex justify-between items-center'}>
            <div className={'max-w-xl'}>
               <h1 className="text-5xl font-bold text-black leading-tight">
                  Welcome to <span className="text-blue-main font-bold">ImUsum</span> place,where{' '}
                  {'  '}
                  <span className="text-blue-main font-bold">education</span> meets{'  '}
                  <span className="text-blue-main font-bold">inspiration</span>
               </h1>
               <p className=" max-w-md text-xl text-neutral-500 font-normal mt-1">
                  Education transcends boundaries, innovation meets inspiration, and the future of
                  learning is redefined.
               </p>
               <a href="#">
                  <button className="border border-blue-main rounded-md py-3 px-7 text-blue-main text-xl font-normal mt-5 hover:bg-blue-main hover:text-white transition-all duration-300 ease-in-out">
                     Learn more
                  </button>
               </a>
            </div>
            <img src={generalImg} alt="" />
         </div>
      </section>
   );
};

export default MainSection;
