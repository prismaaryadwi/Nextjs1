import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mfymrinerlgzygnoimve.supabase.co'
const supabaseKey = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Ambil semua artikel untuk admin
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data: articles || []
    })
    
  } catch (error) {
    console.error('Admin articles error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data' },
      { status: 500 }
    )
  }
}