import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mfymrinerlgzygnoimve.supabase.co'
const supabaseKey = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
    
    if (category !== 'all') {
      query = query.eq('category_name', category)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data: data || []
    })
    
  } catch (error) {
    console.error('Articles error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil artikel' },
      { status: 500 }
    )
  }
}