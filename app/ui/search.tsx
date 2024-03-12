'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';


export default function Search({ placeholder }: { placeholder: string }) {
  
  // update url with search params
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();


  // update handle search to use debounced callback 
  // so that it doesn't ping the resource database a lot of time
  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);

    // isntantiate a url search params object
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    // set the param string based on input
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }

    // finally update the url path name with the new search params
    replace(`${pathname}?${params.toString()}`);
  }, 300);

    
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value)
        }}
        //  keeping the url and input in sync when sharing
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
