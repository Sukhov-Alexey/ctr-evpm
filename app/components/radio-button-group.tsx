import { useEffect, useState } from 'react'

export type RBGProps = {
    groupName: string
    values: string[]
    defValue: string
    onChange: (val: string) => void
}

export default function RadioButtonGroup({groupName, values, defValue, onChange}: RBGProps) {
    const [value, setValue] = useState(defValue);

    // workaround for Next.js Bug
    // https://github.com/vercel/next.js/issues/49499
    useEffect(() => {
        const element = document.querySelector(`[type=radio][name=${groupName}][value="${value}]"`) as HTMLInputElement;
        if (element && !element.checked) {
            element.checked = true;
        }
    }, [groupName, value]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onChange(newValue);
    }

    const getKey= (item: string) => `${groupName}_${item}`

    return (
        <div className='flex overflow-hidden gap-x-2'>
            {
                values.map(x => 
                <div className='flex flex-row float-left' 
                    key={getKey(x)}> 
                    <input className='peer hidden' 
                        id={getKey(x)} 
                        type='radio' 
                        name={groupName} 
                        value={x}
                        checked={value === x} 
                        onChange={()=>handleChange(x)}/>
                    <label className='cursor-pointer select-none 
                                        bg-transparent
                                        border-dotted
                                        border-b-2
                                        px-2 pt-1
                                        peer-checked:border-solid peer-checked:font-semibold' 
                        htmlFor={getKey(x)}>
                        {x}
                    </label>
                </div>
                )
            }
        </div>
        
    );
}