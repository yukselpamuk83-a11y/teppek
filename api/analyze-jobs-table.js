import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );

        console.log('🔍 Analyzing jobs table structure...');

        // 1. Get table schema info
        const { data: columns, error: schemaError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'jobs')
            .eq('table_schema', 'public');

        if (schemaError) throw schemaError;

        // 2. Get a sample record to see actual data
        const { data: sampleJob, error: sampleError } = await supabase
            .from('jobs')
            .select('*')
            .limit(1);

        if (sampleError) throw sampleError;

        // 3. Get record count
        const { count, error: countError } = await supabase
            .from('jobs')
            .select('id', { count: 'exact' });

        if (countError) throw countError;

        // 4. Check which fields have actual data vs NULL
        const analysis = {};
        if (sampleJob && sampleJob.length > 0) {
            const sample = sampleJob[0];
            for (const [key, value] of Object.entries(sample)) {
                analysis[key] = {
                    hasValue: value !== null && value !== undefined && value !== '',
                    sampleValue: typeof value === 'string' && value.length > 100 ? 
                        value.substring(0, 100) + '...' : value
                };
            }
        }

        const report = {
            tableName: 'jobs',
            totalRecords: count,
            totalColumns: columns.length,
            columns: columns.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default,
                hasActualData: analysis[col.column_name]?.hasValue || false,
                sampleValue: analysis[col.column_name]?.sampleValue
            })),
            bucketRequiredFields: [
                'id', 'title', 'lat', 'lon', 'company', 
                'city', 'country', 'salary_min', 'salary_max', 
                'currency', 'url', 'source', 'remote', 'type'
            ]
        };

        console.log('📊 Jobs table analysis completed');
        console.log(`📋 Total columns: ${columns.length}`);
        console.log(`📋 Total records: ${count}`);

        return res.status(200).json(report);

    } catch (error) {
        console.error('❌ Analysis error:', error);
        return res.status(500).json({ 
            error: 'Table analysis failed', 
            details: error.message 
        });
    }
}