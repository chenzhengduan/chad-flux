<template>
  <div class="fal-ai-image-edit">
    <h2>fal.ai 图像编辑 DEMO</h2>
    <div class="apikey-section">
      <el-form :inline="true" class="apikey-form">
        <el-form-item label="API Key：">
          <el-input
            v-model="apiKeyInput"
            type="password"
            placeholder="请输入 fal.ai API Key"
            style="width: 260px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveApiKey">保存</el-button>
          <el-button v-if="apiKey" @click="clearApiKey" type="default">清除</el-button>
        </el-form-item>
      </el-form>
      <div class="tip" v-if="!apiKey">
        <span style="color: red;">请先输入 API Key，所有功能仅用于 DEMO，切勿用于生产环境！</span>
      </div>
      <div class="tip" v-else>
        <span style="color: green;">API Key 已保存，可正常使用 fal.ai 能力。</span>
      </div>
    </div>
    <el-form class="falai-form" @submit.prevent="onSubmit" label-width="140px">
      <el-form-item label="描述（Prompt）：">
        <el-input
          v-model="prompt"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 8 }"
          :disabled="!apiKey"
          placeholder="请输入描述，如：在面粉旁边放一个甜甜圈。"
          style="width: 100%; font-size: 16px;"
        />
      </el-form-item>
      <el-form-item label="图片：">
        <el-upload
          :show-file-list="true"
          :disabled="!apiKey"
          accept="image/*"
          action="#"
          :auto-upload="false"
          :on-change="onFileChange"
          :limit="1"
        >
          <el-button :disabled="!apiKey">选择图片</el-button>
        </el-upload>
        <span style="margin: 0 8px;">或</span>
        <el-input v-model="imageUrl" :disabled="!apiKey" placeholder="图片 URL（可选）" style="width: 260px;" />
      </el-form-item>
      <el-form-item label="引导强度（guidance_scale）：">
        <el-input-number v-model="guidanceScale" :min="1" :max="20" :step="0.1" :disabled="!apiKey" />
      </el-form-item>
      <el-form-item label="生成图片数量（num_images）：">
        <el-input-number v-model="numImages" :min="1" :max="4" :disabled="!apiKey" />
      </el-form-item>
      <el-form-item label="输出格式（output_format）：">
        <el-select v-model="outputFormat" :disabled="!apiKey" style="width: 120px;">
          <el-option label="JPEG 格式" value="jpeg" />
          <el-option label="PNG 格式" value="png" />
        </el-select>
      </el-form-item>
      <el-form-item label="宽高比（aspect_ratio）：">
        <el-select v-model="aspectRatio" :disabled="!apiKey" style="width: 120px;">
          <el-option label="默认" value="" />
          <el-option label="21:9" value="21:9" />
          <el-option label="16:9" value="16:9" />
          <el-option label="4:3" value="4:3" />
          <el-option label="3:2" value="3:2" />
          <el-option label="1:1" value="1:1" />
          <el-option label="2:3" value="2:3" />
          <el-option label="3:4" value="3:4" />
          <el-option label="9:16" value="9:16" />
          <el-option label="9:21" value="9:21" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :disabled="!apiKey || loading">{{ loading ? '生成中...' : '生成图片' }}</el-button>
      </el-form-item>
    </el-form>
    <div v-if="errorMsg" style="color: red; margin-top: 16px;">{{ errorMsg }}</div>
    <div v-if="logs.length" style="margin-top: 16px;">
      <div style="font-weight: bold;">日志：</div>
      <ul>
        <li v-for="(log, i) in logs" :key="i">{{ log }}</li>
      </ul>
    </div>
    <div v-if="resultImages.length" style="margin-top: 24px;">
      <div style="font-weight: bold;">生成结果：</div>
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        <div v-for="(img, i) in resultImages" :key="i" style="border:1px solid #eee; padding:8px; border-radius:6px; background:#fff;">
          <img :src="img.url" :alt="'result-'+i" :width="img.width/4" :height="img.height/4" style="max-width:200px; display:block; margin-bottom:8px;" />
          <div style="font-size:12px; color:#888;">{{ img.width }}x{{ img.height }}</div>
        </div>
      </div>
    </div>
    <div v-if="history.length" style="margin-top: 40px;">
      <div style="font-weight: bold; font-size: 16px;">历史记录</div>
      <div v-for="(item, idx) in history" :key="idx" style="margin-top: 18px; padding:12px; border:1px solid #eee; border-radius:6px; background:#f8f8fa;">
        <div style="font-size:13px; color:#888; margin-bottom:6px;">{{ item.time }}</div>
        <div style="margin-bottom:6px;">Prompt: <span style="color:#333">{{ item.params.prompt }}</span></div>
        <div style="margin-bottom:6px;">引导强度: {{ item.params.guidance_scale }} | 数量: {{ item.params.num_images }} | 输出格式: {{ item.params.output_format }} <span v-if="item.params.aspect_ratio">| 宽高比: {{ item.params.aspect_ratio }}</span></div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div v-for="(img, i) in item.images" :key="i" style="border:1px solid #eee; padding:4px; border-radius:4px; background:#fff;">
            <img :src="img.url" :alt="'history-'+idx+'-'+i" :width="img.width/8" :height="img.height/8" style="max-width:100px; display:block;" />
            <div style="font-size:11px; color:#aaa;">{{ img.width }}x{{ img.height }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
let fal: any = null;

const apiKeyInput = ref('');
const apiKey = ref<string | null>(null);

onMounted(async () => {
  const saved = localStorage.getItem('fal_apikey');
  if (saved) {
    apiKeyInput.value = saved;
    apiKey.value = saved;
    await loadFalClient();
    if (apiKey.value) fal.config({ credentials: apiKey.value });
  }
});

async function loadFalClient() {
  if (!fal) {
    fal = (await import('@fal-ai/client')).fal;
  }
}

function saveApiKey() {
  if (apiKeyInput.value) {
    localStorage.setItem('fal_apikey', apiKeyInput.value);
    apiKey.value = apiKeyInput.value;
    if (fal) fal.config({ credentials: apiKeyInput.value });
  }
}

function clearApiKey() {
  localStorage.removeItem('fal_apikey');
  apiKeyInput.value = '';
  apiKey.value = null;
}

const prompt = ref('');
const imageUrl = ref('');
const file = ref<File | null>(null);
const guidanceScale = ref(3.5);
const numImages = ref(1);
const outputFormat = ref('jpeg');
const aspectRatio = ref('');

const loading = ref(false);
const logs = ref<string[]>([]);
const errorMsg = ref('');
const resultImages = ref<{url:string,width:number,height:number}[]>([]);
const history = ref<{params:any, images:any[], time:string}[]>([]);

function onFileChange(uploadFile) {
  file.value = uploadFile.raw || null;
}

async function onSubmit() {
  errorMsg.value = '';
  logs.value = [];
  resultImages.value = [];
  
  // 检查必填项
  if (!prompt.value.trim()) {
    errorMsg.value = '请输入描述（Prompt）';
    return;
  }
  
  loading.value = true;
  await loadFalClient();
  if (!fal) {
    errorMsg.value = 'fal-ai 客户端加载失败';
    loading.value = false;
    return;
  }
  if (!apiKey.value) {
    errorMsg.value = '请先输入 API Key';
    loading.value = false;
    return;
  }
  fal.config({ credentials: apiKey.value });
  let usedImageUrl = imageUrl.value;
  try {
    if (file.value) {
      logs.value.push('正在上传图片...');
      const url = await fal.storage.upload(file.value);
      usedImageUrl = url;
      logs.value.push('图片上传成功');
    }
    if (!usedImageUrl) {
      errorMsg.value = '请上传图片或填写图片 URL';
      loading.value = false;
      return;
    }
    logs.value.push('正在请求 fal.ai 生成图片...');
    const params = {
      prompt: prompt.value,
      image_url: usedImageUrl,
      guidance_scale: guidanceScale.value,
      num_images: numImages.value,
      output_format: outputFormat.value,
      ...(aspectRatio.value ? { aspect_ratio: aspectRatio.value } : {})
    };
    const result = await fal.subscribe('fal-ai/flux-pro/kontext/max', {
      input: params,
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log: any) => log.message).forEach((msg: string) => {
            if (!logs.value.includes(msg)) logs.value.push(msg);
          });
        }
      }
    });
    if (result.data && result.data.images) {
      resultImages.value = result.data.images;
      logs.value.push('图片生成成功');
      history.value.unshift({
        params: JSON.parse(JSON.stringify(params)),
        images: JSON.parse(JSON.stringify(result.data.images)),
        time: new Date().toLocaleString()
      });
    } else {
      errorMsg.value = '未获取到图片结果';
    }
  } catch (e: any) {
    errorMsg.value = e?.message || '请求失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.fal-ai-image-edit {
  max-width: 700px;
  margin: 40px auto;
  padding: 32px 32px 24px 32px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
}
.apikey-section {
  margin-bottom: 24px;
}
.falai-form {
  margin-top: 32px;
  padding: 16px 0 0 0;
  background: #fff;
  border-radius: 6px;
  border: none;
}
.tip {
  margin-top: 8px;
  font-size: 14px;
}
</style> 