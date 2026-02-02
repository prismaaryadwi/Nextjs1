import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file' },
        { status: 400 }
      )
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    const ext = path.extname(file.name) || '.jpg'
    const filename = `seija_${timestamp}_${random}${ext}`
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    
    const fileUrl = `/uploads/${filename}`
    
    return NextResponse.json({
      success: true,
      message: 'Upload berhasil',
      url: fileUrl,
      filename: filename
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Upload gagal' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}