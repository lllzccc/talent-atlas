import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'知序 · AI 人才盘点',description:'年度人才盘点、组织梯队与发展工作台'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
