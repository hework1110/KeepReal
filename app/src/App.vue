<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { ensureStore } from './store/storage'

onLaunch(() => {
  ensureStore()
})
</script>

<style>
@import './styles/tokens.css';
</style>
