// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diupload' },
        { status: 400 }
      );
    }
    
    // Supabase config
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `seija_${timestamp}_${random}.${ext}`;
    const filePath = `uploads/${filename}`;
    
    const buffer = await file.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('seija-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('seija-files')
      .getPublicUrl(filePath);
    
    return NextResponse.json({
      success: true,
      message: 'Gambar berhasil diupload',
      url: urlData.publicUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengupload gambar' },
      { status: 500 }
    );
  }
}