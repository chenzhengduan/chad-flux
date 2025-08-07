<template>
  <div class="fal-ai-image-edit">
    <h2>fal.ai 图像编辑 DEMO</h2>
    <div class="apikey-section">
      <label for="fal-apikey">API Key：</label>
      <input
        id="fal-apikey"
        v-model="apiKeyInput"
        type="password"
        placeholder="请输入 fal.ai API Key"
      />
      <button @click="saveApiKey">保存</button>
      <button v-if="apiKey" @click="clearApiKey">清除</button>
      <div class="tip" v-if="!apiKey">
        <span style="color: red;">请先输入 API Key，所有功能仅用于 DEMO，切勿用于生产环境！</span>
      </div>
      <div class="tip" v-else>
        <span style="color: green;">API Key 已保存，可正常使用 fal.ai 能力。</span>
      </div>
    </div>
    <!-- 后续功能区 -->
    <form class="falai-form" @submit.prevent="onSubmit">
      <div class="form-row">
        <label>描述（Prompt）：</label>
        <input v-model="prompt" :disabled="!apiKey" placeholder="请输入描述，如：在面粉旁边放一个甜甜圈。" />
      </div>
      <div class="form-row">
        <label>图片：</label>
        <input type="file" accept="image/*" @change="onFileChange" :disabled="!apiKey" />
        <span style="margin: 0 8px;">或</span>
        <input v-model="imageUrl" :disabled="!apiKey" placeholder="图片 URL（可选）" />
      </div>
      <div class="form-row">
        <label>引导强度（guidance_scale）：</label>
        <input type="number" step="0.1" v-model.number="guidanceScale" :disabled="!apiKey" min="1" max="20" />
      </div>
      <div class="form-row">
        <label>生成图片数量（num_images）：</label>
        <input type="number" v-model.number="numImages" :disabled="!apiKey" min="1" max="4" />
      </div>
      <div class="form-row">
        <label>输出格式（output_format）：</label>
        <select v-model="outputFormat" :disabled="!apiKey">
          <option value="jpeg">JPEG 格式</option>
          <option value="png">PNG 格式</option>
        </select>
      </div>
      <div class="form-row">
        <label>宽高比（aspect_ratio）：</label>
        <select v-model="aspectRatio" :disabled="!apiKey">
          <option value="">默认</option>
          <option value="21:9">21:9</option>
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
          <option value="3:2">3:2</option>
          <option value="1:1">1:1</option>
          <option value="2:3">2:3</option>
          <option value="3:4">3:4</option>
          <option value="9:16">9:16</option>
          <option value="9:21">9:21</option>
        </select>
      </div>
      <div class="form-row">
        <button type="submit" :disabled="!apiKey || loading">{{ loading ? '生成中...' : '生成图片' }}</button>
      </div>
    </form>
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
        <div style="margin-bottom:6px;">guidance_scale: {{ item.params.guidance_scale }} | num_images: {{ item.params.num_images }} | output_format: {{ item.params.output_format }} <span v-if="item.params.aspect_ratio">| aspect_ratio: {{ item.params.aspect_ratio }}</span></div>
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

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
  } else {
    file.value = null;
  }
}

async function onSubmit() {
  errorMsg.value = '';
  logs.value = [];
  resultImages.value = [];
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
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafbfc;
}
.apikey-section {
  margin-bottom: 24px;
}
input[type="password"] {
  margin: 0 8px;
  padding: 4px 8px;
}
button {
  margin-right: 8px;
}
.tip {
  margin-top: 8px;
  font-size: 14px;
}
.falai-form {
  margin-top: 32px;
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #eee;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.form-row label {
  width: 120px;
  font-weight: bold;
}
.form-row input,
.form-row select {
  flex: 1;
  padding: 4px 8px;
  margin-right: 8px;
}
</style> 