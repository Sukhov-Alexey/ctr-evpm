import { ReactNode } from 'react'

type ContentPanelProps = {
    children: ReactNode
}

export default function ContentPanel({children}: ContentPanelProps) {
    return <div className='flex flex-col [&>*]:py-4 w-full lg:[&>*]:px-4 h-full content-center rounded-2xl bg-panel shadow-md'>
        {children}
    </div>
}